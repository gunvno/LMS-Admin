"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HasPermissionProps {
  required: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HasPermission({ required, children, fallback = null }: HasPermissionProps) {
  const { hasPermission } = useAuth();

  if (hasPermission(required)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
