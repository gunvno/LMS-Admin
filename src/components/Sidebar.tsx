"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthCookies } from "@/lib/api-client";
import {
  LayoutDashboard,
  FolderOpen,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Users,
  Badge,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import "./Sidebar.css";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Categories", href: "/categories", icon: FolderOpen },
  { name: "Courses", href: "/courses", icon: GraduationCap },
  { name: "Lessons", href: "/lessons", icon: BookOpen },
  { name: "Quiz", href: "/quiz", icon: HelpCircle },
  { name: "Enrollment", href: "/enrollment", icon: Users },
  { name: "Certificates", href: "/certificates", icon: Badge },
  { name: "Staff", href: "/staff", icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-mark">
          <GraduationCap size={24} />
        </div>
        <div className="admin-info">
          <h2 className="admin-title">EduFlow LMS</h2>
          <span className="admin-subtitle">Admin Console</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Admin navigation">
        <div className="nav-section-label">Workspace</div>
        <ul className="nav-list">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.name} className="nav-item">
                <Link href={item.href} className={`nav-link ${isActive ? "active" : ""}`}>
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
          <div className="account-avatar">AD</div>
          <div>
            <div className="account-name">Admin</div>
            <div className="account-role">Instructor</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sign-out-btn">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
