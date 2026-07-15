"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionCode, PermissionMode } from '@/lib/permissions';

interface HasPermissionProps {
  required: PermissionCode | readonly PermissionCode[];
  mode?: PermissionMode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HasPermission({ required, mode = 'any', children, fallback = null }: HasPermissionProps) {
  const { hasPermission } = useAuth();

  if (hasPermission(required, mode)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
