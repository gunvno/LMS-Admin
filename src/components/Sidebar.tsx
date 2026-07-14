"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuthCookies } from "@/lib/api-client";
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

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Categories", href: "/categories", icon: FolderOpen, adminOnly: true },
  { name: "Courses", href: "/courses", icon: GraduationCap },
  { name: "Lessons", href: "/lessons", icon: BookOpen },
  { name: "Quiz", href: "/quiz", icon: HelpCircle },
  { name: "Enrollment", href: "/enrollment", icon: Users },
  { name: "Messages", href: "/messages", icon: MessagesSquare },
  { name: "Payments", href: "/payments", icon: CreditCard, adminOnly: true },
  { name: "Certificates", href: "/certificates", icon: Badge },
  { name: "Notices", href: "/notices", icon: Bell, adminOnly: true },
  { name: "Staff", href: "/staff", icon: ShieldCheck, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, user, roles } = useAuth();
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const displayName = user?.fullName || user?.username || "Tài khoản";
  const displayRole = isAdmin ? "Admin" : (roles[0] || "Instructor").replace(/^ROLE_/, "");

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
    try {
      await import("@/services/auth.service").then((m) => m.authService.logout());
    } catch {
      console.warn("Logout API failed");
    }
    clearAuthCookies();
    router.push("/");
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
