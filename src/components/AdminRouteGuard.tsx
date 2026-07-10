"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_ONLY_PREFIXES = ["/categories", "/payments", "/notices", "/staff"];

export default function AdminRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const adminOnly = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (adminOnly && !isAdmin) {
    return (
      <div className="page-container">
        <div className="card p-6">
          <h1 className="text-headline-md">Không có quyền truy cập</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Khu vực này chỉ dành cho quản trị viên hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
