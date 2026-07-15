"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminRoute, getRoutePermission } from "@/lib/permissions";

export default function AdminRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const requirement = getRoutePermission(pathname);

  if (!canAccessAdminRoute(permissions, pathname)) {
    return (
      <div className="page-container">
        <div className="card p-6">
          <h1 className="text-headline-md">Không có quyền truy cập</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            {requirement
              ? `Tài khoản của bạn chưa được cấp đủ quyền để truy cập ${requirement.title}.`
              : "Trang này chưa được cấu hình quyền truy cập trong frontend quản trị."}
          </p>
          <Link href="/dashboard" className="btn btn-primary mt-4">Về trang tổng quan</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
