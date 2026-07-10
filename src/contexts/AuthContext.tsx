"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthCookies, getCookie } from '@/lib/api-client';
import { UserInfo } from '@/services/auth.service';
import { authorService } from '@/services/author.service';

interface AuthContextType {
  user: UserInfo | null;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  hasRole: (requiredRole: string | string[]) => boolean;
  hasPermission: (requiredPerm: string | string[]) => boolean;
  setPermissions: (perms: string[]) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: [],
  permissions: [],
  isAdmin: false,
  hasRole: () => false,
  hasPermission: () => false,
  setPermissions: () => {},
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userRoles, userPerms] = await Promise.all([
          authorService.getMyRoles(),
          authorService.getMyPermissions(),
        ]);

        if (!canAccessAdmin(userRoles || [])) {
          clearAuthCookies();
          router.push('/');
          return;
        }

        const cachedUser = getCookie('auth_user');
        const userInfo = cachedUser ? JSON.parse(cachedUser) : {};
        setUser({
          id: userInfo.id || '',
          username: userInfo.username || '',
          email: userInfo.email || '',
          fullName: userInfo.fullName || '',
          roles: userRoles || [],
        });
        setRoles(userRoles || []);
        setPermissions(userPerms || []);
      } catch {
        clearAuthCookies();
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const hasPermission = (requiredPerm: string | string[]) => {
    if (typeof requiredPerm === 'string') {
      return permissions.includes(requiredPerm);
    }
    return requiredPerm.some(perm => permissions.includes(perm));
  };

  const hasRole = (requiredRole: string | string[]) => {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return requiredRoles.some((role) => roles.map(normalizeRole).includes(normalizeRole(role)));
  };

  const isAdmin = hasRole('ADMIN');

  return (
    <AuthContext.Provider value={{ user, roles, permissions, hasPermission, isAdmin, hasRole, setPermissions, loading }}>
      {!loading ? children : <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Workspace...</div>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
