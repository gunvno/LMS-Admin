"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthCookies, setCookie } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { authorService } from "@/services/author.service";
import "./login.css";
import { Shield } from "lucide-react";

function normalizeRole(role: string) {
  return role.replace(/^ROLE_/, '').toUpperCase();
}

function canAccessAdmin(roles: string[]) {
  return roles.map(normalizeRole).some(role => role === 'ADMIN' || role === 'INSTRUCTOR');
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    clearAuthCookies();

    try {
      const response = await authService.login({ username, password });
      const token = response.token;

      if (!token) {
        throw new Error("Không nhận được token từ server.");
      }

      setCookie('auth_token', token);
      if (response.refreshToken) {
        setCookie('refresh_token', response.refreshToken);
      }
      setCookie('auth_user', JSON.stringify({
        username: response.userName || username,
        email: response.email || '',
        fullName: [response.firstName, response.lastName].filter(Boolean).join(' ').trim(),
      }));

      const roles = await authorService.getMyRoles();
      if (!canAccessAdmin(roles || [])) {
        clearAuthCookies();
        throw new Error("Tài khoản của bạn không có quyền truy cập vào trang quản trị.");
      }

      setCookie('auth', 'true');
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      clearAuthCookies();
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header">
          <div className="logo-icon">
            <Shield size={24} color="#ffffff" />
          </div>
          <h1 className="text-display" style={{ fontSize: '28px', lineHeight: '36px', color: 'var(--primary)' }}>
            EduFlow Admin
          </h1>
          <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>
            Sign in to your instructor workspace.
          </p>
        </div>

        <div className="card login-card">
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="text-label-md">
                Username / Email <span style={{ color: 'var(--status-required)' }}>*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="admin@gmail.com" 
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="text-label-md">
                Password <span style={{ color: 'var(--status-required)' }}>*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary login-btn mt-6" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              {loading ? "Signing In..." : "Sign In to Workspace"}
            </button>
          </form>
        </div>

        <div className="login-footer text-body-sm">
          <p>© 2024 EduFlow Learning Management System.</p>
          <p>Secure Admin Portal.</p>
        </div>
      </div>
    </div>
  );
}
