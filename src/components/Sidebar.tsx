"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Users,
  Badge,
  Bell,
  LogOut,
  ShieldCheck,
  CreditCard,
  Menu,
  X,
  MessagesSquare,
} from "lucide-react";
import "./Sidebar.css";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION, satisfiesRequirement, type PermissionRequirement } from "@/lib/permissions";

type NavItem = PermissionRequirement & {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const navItems: readonly NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Categories", href: "/categories", icon: FolderOpen, allOf: [PERMISSION.CATEGORY_VIEW] },
  { name: "Courses", href: "/courses", icon: GraduationCap, allOf: [PERMISSION.COURSE_VIEW] },
  { name: "Lessons", href: "/lessons", icon: BookOpen, allOf: [PERMISSION.LESSON_VIEW] },
  { name: "Quiz", href: "/quiz", icon: HelpCircle, allOf: [PERMISSION.QUIZ_VIEW] },
  { name: "Enrollment", href: "/enrollment", icon: Users, allOf: [PERMISSION.ENROLLMENT_VIEW] },
  { name: "Messages", href: "/messages", icon: MessagesSquare },
  { name: "Payments", href: "/payments", icon: CreditCard, allOf: [PERMISSION.PAYMENT_MANAGE] },
  {
    name: "Certificates",
    href: "/certificates",
    icon: Badge,
    anyOf: [PERMISSION.CERTIFICATE_MANAGE, PERMISSION.CERTIFICATE_VERIFY],
  },
  {
    name: "Notices",
    href: "/notices",
    icon: Bell,
    anyOf: [PERMISSION.NOTICE_VIEW, PERMISSION.NOTICE_BROADCAST],
  },
  { name: "Staff", href: "/staff", icon: ShieldCheck, allOf: [PERMISSION.STAFF_VIEW] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, roles, permissions, logout } = useAuth();
  const visibleNavItems = navItems.filter((item) => satisfiesRequirement(permissions, item));
  const displayName = user?.fullName || user?.username || "Tài khoản";
  const normalizedRoles = roles.map((role) => role.replace(/^ROLE_/, "").toUpperCase());
  const displayRole = normalizedRoles.includes("ADMIN") ? "Admin" : normalizedRoles[0] || "Instructor";

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="mobile-admin-bar">
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label="Mở menu quản trị"
          aria-controls="admin-sidebar"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
        <Link href="/dashboard" className="mobile-brand" onClick={() => setMobileOpen(false)}>
          <span className="mobile-brand-mark"><GraduationCap size={20} /></span>
          <span>EduFlow LMS</span>
        </Link>
      </header>

      <button
        type="button"
        className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        aria-label="Đóng menu quản trị"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />

      <aside id="admin-sidebar" className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand-mark">
          <GraduationCap size={24} />
        </div>
        <div className="admin-info">
          <h2 className="admin-title">EduFlow LMS</h2>
          <span className="admin-subtitle">Admin Console</span>
        </div>
        <button type="button" className="sidebar-close" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Admin navigation">
        <div className="nav-section-label">Workspace</div>
        <ul className="nav-list">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.name} className="nav-item">
                <Link href={item.href} className={`nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
                  <Icon className="nav-icon" size={19} />
                  <span className="nav-text">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-account">
          <div className="account-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="account-name">{displayName}</div>
            <div className="account-role">{displayRole}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sign-out-btn">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
      </aside>
    </>
  );
}
