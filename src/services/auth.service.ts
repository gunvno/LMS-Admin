import { apiClient } from '@/lib/api-client';

export interface LoginRequest {
  username: string;
  password: string;
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
  login: (data: LoginRequest): Promise<void> => {
    return apiClient<void>('/auth/token', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: false,
    });
  },

  getMe: async (): Promise<UserInfo> => {
    const response = await apiClient<BackendUserInfo>('/auth/userinfo', {
      method: 'POST',
    });
    return mapUserInfo(response);
  },

  logout: (): Promise<void> => {
    return apiClient<void>('/auth/logout', {
      method: 'POST',
      requireAuth: false,
    });
  },
};
