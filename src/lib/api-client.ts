const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';
const CLIENT_PORTAL = 'ADMIN';

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

let refreshPromise: Promise<boolean> | null = null;

async function performSessionRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept-Language': 'vi',
        'X-Client-Portal': CLIENT_PORTAL,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performSessionRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function clearSessionAndRedirect() {
  clearAuthCookies();
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.href = '/?expired=1';
  }
}


interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  unwrap?: boolean;
}

type BackendResponse<T> = {
  data?: T;
  status?: string;
  errorCode?: string;
  message?: string;
};

function buildErrorMessage(status: number, backendMessage?: string) {
  if (backendMessage && !['OK', 'LOGIN_FAILED', 'UNAUTHENTICATED'].includes(backendMessage)) {
    return backendMessage;
  }
  if (status === 400) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
  if (status === 401) return 'Sai thông tin đăng nhập hoặc phiên làm việc đã hết hạn.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (status >= 500) return 'Lỗi hệ thống máy chủ, vui lòng thử lại sau.';
  return backendMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

export async function apiClient<T>(
  endpoint: string,
  { requireAuth = true, unwrap = true, ...customConfig }: FetchOptions = {}
): Promise<T> {
  return executeRequest<T>(endpoint, { requireAuth, unwrap, ...customConfig }, true);
}

async function executeRequest<T>(
  endpoint: string,
  { requireAuth = true, unwrap = true, ...customConfig }: FetchOptions,
  allowRefresh: boolean
): Promise<T> {
  const headers = new Headers(customConfig.headers);

  const isFormData = customConfig.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'vi');
  }
  headers.set('X-Client-Portal', CLIENT_PORTAL);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...customConfig,
    credentials: 'include',
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();
  const parsed = rawText && contentType.includes('application/json') ? JSON.parse(rawText) : rawText;

  if (!response.ok) {
    if (response.status === 401 && requireAuth) {
      if (allowRefresh) {
        const refreshed = await refreshSession();
        if (refreshed) {
          return executeRequest<T>(endpoint, { requireAuth, unwrap, ...customConfig }, false);
        }
      }
      clearSessionAndRedirect();
    }
    const backendMessage = typeof parsed === 'object' && parsed !== null
      ? (parsed.message || parsed.error || parsed.errorCode)
      : String(parsed || response.statusText);
    throw new Error(buildErrorMessage(response.status, backendMessage));
  }

  if (!unwrap || typeof parsed !== 'object' || parsed === null || !('data' in parsed)) {
    return parsed as T;
  }

  const backendResponse = parsed as BackendResponse<T>;
  if (backendResponse.errorCode && backendResponse.errorCode !== 'EV-200') {
    throw new Error(buildErrorMessage(response.status, backendResponse.message || backendResponse.errorCode));
  }

  return backendResponse.data as T;
}
