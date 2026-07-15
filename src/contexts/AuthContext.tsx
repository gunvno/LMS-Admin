"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthCookies } from '@/lib/api-client';
import { authService, UserInfo } from '@/services/auth.service';
import { authorService } from '@/services/author.service';
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
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: [],
  permissions: [],
  hasPermission: () => false,
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [currentUser, userRoles, userPerms] = await Promise.all([
          authService.getMe(),
          authorService.getMyRoles(),
          authorService.getMyPermissions(),
        ]);

        if (!canAccessAdmin(userRoles || [])) {
          await authService.logout().catch(() => undefined);
          clearAuthCookies();
          router.replace('/');
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
        clearAuthCookies();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

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
          setAuthorized(false);
          await authService.logout().catch(() => undefined);
          clearAuthCookies();
          router.replace('/');
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
  }, [authorized, router]);

  const hasPermission = useCallback(
    (requiredPerm: PermissionCode | readonly PermissionCode[], mode: PermissionMode = 'any') =>
      hasRequiredPermission(permissions, requiredPerm, mode),
    [permissions]
  );

  return (
    <AuthContext.Provider value={{ user, roles, permissions, hasPermission, loading }}>
      {!loading && authorized
        ? children
        : <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>{loading ? 'Đang tải không gian làm việc...' : 'Đang chuyển đến trang đăng nhập...'}</div>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
