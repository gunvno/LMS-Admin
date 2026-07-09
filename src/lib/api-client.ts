const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';

// Helper to get cookies from document (client-side only)
export function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const rawValue = parts.pop()?.split(';').shift() || '';
    return rawValue ? decodeURIComponent(rawValue) : null;
  }
  return null;
}

export function setCookie(name: string, value: string, maxAge = 86400) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
  const headers = new Headers(customConfig.headers);

  const isFormData = customConfig.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'vi');
  }

  if (requireAuth) {
    const token = getCookie('auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...customConfig,
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
      clearAuthCookies();
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
