"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthCookies } from '@/lib/api-client';
import { authService, UserInfo } from '@/services/auth.service';
import { authorService } from '@/services/author.service';
import { deactivateCurrentPushInstallation } from '@/lib/push-device';
import {
  hasRequiredPermission,
  normalizePermissions,
  type PermissionCode,
  type PermissionMode,
} from '@/lib/permissions';

interface AuthContextType {
  user: UserInfo | null;
  roles: string[];
  permissions: string[];
  hasPermission: (requiredPerm: PermissionCode | readonly PermissionCode[], mode?: PermissionMode) => boolean;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: [],
  permissions: [],
  hasPermission: () => false,
  logout: async () => undefined,
  loading: true,
});

function normalizeRole(role: string) {
  return role.replace(/^ROLE_/, '').toUpperCase();
}

function canAccessAdmin(roles: string[]) {
  return roles.map(normalizeRole).some(role => role === 'ADMIN' || role === 'INSTRUCTOR');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const logout = useCallback(async () => {
    await deactivateCurrentPushInstallation().catch(() => undefined);
    await authService.logout().catch(() => undefined);
    clearAuthCookies();
    setAuthorized(false);
    setUser(null);
    setRoles([]);
    setPermissions([]);
    router.replace('/');
  }, [router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [currentUser, userRoles, userPerms] = await Promise.all([
          authService.getMe(),
          authorService.getMyRoles(),
          authorService.getMyPermissions(),
        ]);

        if (!canAccessAdmin(userRoles || [])) {
          await logout();
          return;
        }

        setUser({
          ...currentUser,
          roles: userRoles || [],
        });
        setRoles(userRoles || []);
        setPermissions(normalizePermissions(userPerms));
        setAuthorized(true);
      } catch {
        setAuthorized(false);
        await deactivateCurrentPushInstallation().catch(() => undefined);
        clearAuthCookies();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [logout, router]);

  useEffect(() => {
    if (!authorized) return;
    let active = true;

    const refreshAccess = async () => {
      try {
        const [nextRoles, nextPermissions] = await Promise.all([
          authorService.getMyRoles(),
          authorService.getMyPermissions(),
        ]);
        if (!active) return;
        if (!canAccessAdmin(nextRoles || [])) {
          await logout();
          return;
        }
        setRoles(nextRoles || []);
        setPermissions(normalizePermissions(nextPermissions));
      } catch {
        // Keep the last known UI policy on a transient refresh failure.
        // Protected backend endpoints remain the final authorization boundary.
      }
    };

    const refreshOnFocus = () => void refreshAccess();
    const refreshInterval = window.setInterval(() => void refreshAccess(), 60_000);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [authorized, logout]);

  const hasPermission = useCallback(
    (requiredPerm: PermissionCode | readonly PermissionCode[], mode: PermissionMode = 'any') =>
      hasRequiredPermission(permissions, requiredPerm, mode),
    [permissions]
  );

  return (
    <AuthContext.Provider value={{ user, roles, permissions, hasPermission, logout, loading }}>
      {!loading && authorized
        ? children
        : <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>{loading ? 'Đang tải không gian làm việc...' : 'Đang chuyển đến trang đăng nhập...'}</div>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
