import { apiClient, getCookie } from '@/lib/api-client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  permissions?: string[];
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  roles?: string[];
}

type BackendUserInfo = {
  sub?: string;
  id?: string;
  preferred_username?: string;
  username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  fullName?: string;
};

function mapUserInfo(user: BackendUserInfo): UserInfo {
  return {
    id: user.sub || user.id || '',
    username: user.preferred_username || user.username || '',
    email: user.email || '',
    fullName: user.fullName || [user.given_name, user.family_name].filter(Boolean).join(' ').trim(),
  };
}

export const authService = {
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/token', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: false,
    });
  },

  refreshToken: (token: string): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
      requireAuth: false,
    });
  },

  getMe: async (): Promise<UserInfo> => {
    const token = getCookie('auth_token');
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    const response = await apiClient<BackendUserInfo>('/auth/userinfo', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: token,
    });
    return mapUserInfo(response);
  },

  logout: (): Promise<void> => {
    const token = getCookie('auth_token');
    return apiClient<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};
