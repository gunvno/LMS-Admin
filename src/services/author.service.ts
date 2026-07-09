import { apiClient } from '@/lib/api-client';

export type StaffAccount = {
  userId: string;
  username: string;
  email: string;
  phone?: string;
  fullName?: string;
  roleCode?: string;
  permissionCodes?: string[];
};

export type Permission = {
  id?: string;
  code: string;
  name?: string;
  description?: string;
};

export type CreateStaffPayload = {
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export const authorService = {
  getMyPermissions: (): Promise<string[]> => {
    return apiClient<string[]>('/author/api/v1/users/me/permissions', {
      method: 'GET',
    });
  },

  getMyRoles: (): Promise<string[]> => {
    return apiClient<string[]>('/author/api/v1/users/me/roles', {
      method: 'GET',
    });
  },

  getPermissions: (): Promise<Permission[]> => {
    return apiClient<Permission[]>('/author/api/v1/permissions', {
      method: 'GET',
    });
  },

  getStaffAccounts: (): Promise<StaffAccount[]> => {
    return apiClient<StaffAccount[]>('/author/api/v1/permissions/staff', {
      method: 'GET',
    });
  },

  getStaffAccount: (userId: string): Promise<StaffAccount> => {
    return apiClient<StaffAccount>(`/author/api/v1/permissions/staff/${userId}`, {
      method: 'GET',
    });
  },

  createStaffAccount: (data: CreateStaffPayload): Promise<StaffAccount> => {
    return apiClient<StaffAccount>('/author/api/v1/permissions/staff', {
      method: 'POST',
      body: JSON.stringify({ data, channel: 'WEB', signature: '' }),
    });
  },

  updateStaffPermissions: (userId: string, permissionCodes: string[]): Promise<StaffAccount> => {
    return apiClient<StaffAccount>(`/author/api/v1/permissions/staff/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { permissionCodes }, channel: 'WEB', signature: '' }),
    });
  },

  updateStaffStatus: (userId: string, status: string): Promise<StaffAccount> => {
    return apiClient<StaffAccount>(`/author/api/v1/permissions/staff/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ data: { status }, channel: 'WEB', signature: '' }),
    });
  },

  resetStaffPassword: (userId: string, password: string): Promise<StaffAccount> => {
    return apiClient<StaffAccount>(`/author/api/v1/permissions/staff/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ data: { password }, channel: 'WEB', signature: '' }),
    });
  },
};
