"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Mail, ShieldCheck, Lock, Key, UserRound } from "lucide-react";
import { authorService, Permission, StaffAccount } from "@/services/author.service";
import "./staff.css";
import "../../detail.css";

function initials(name?: string) {
  const source = name || "ST";
  return source.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function StaffDetailsPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [staff, setStaff] = useState<StaffAccount | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [staffData, permissionData] = await Promise.all([
          authorService.getStaffAccount(userId),
          authorService.getPermissions().catch(() => []),
        ]);
        setStaff(staffData);
        setSelectedPermissions(staffData.permissionCodes || []);
        setPermissions(permissionData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chi tiết nhân sự.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const permissionOptions = useMemo(() => {
    if (permissions.length > 0) return permissions;
    return (staff?.permissionCodes || []).map((code): Permission => ({ code, name: code, description: code }));
  }, [permissions, staff]);

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      setSaving(true);
      const updated = await authorService.updateStaffPermissions(userId, selectedPermissions);
      setStaff(updated);
      setSelectedPermissions(updated.permissionCodes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được quyền nhân sự.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const password = window.prompt("Nhập mật khẩu mới", "123456");
    if (!password) return;
    try {
      setSaving(true);
      await authorService.resetStaffPassword(userId, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không reset được mật khẩu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="page-container detail-page">
      <div className="detail-toolbar">
        <Link href="/staff" className="btn btn-ghost"><ArrowLeft size={18} /> Quay lại</Link>
        {staff && (
          <div className="header-actions">
            <button type="button" className="btn btn-ghost" onClick={handleResetPassword} disabled={saving}><Key size={18} /> Reset mật khẩu</button>
            <button type="submit" className="btn btn-primary" disabled={saving}><Save size={18} /> {saving ? "Đang lưu..." : "Lưu quyền"}</button>
          </div>
        )}
      </div>

      {error && <div className="card p-6 mb-6" style={{ color: "var(--on-error-container)", backgroundColor: "var(--error-container)" }}>{error}</div>}

      {loading ? (
        <div className="card p-6">Đang tải...</div>
      ) : staff ? (
        <>
          <section className="detail-hero-card">
            <div className="detail-avatar">{initials(staff.fullName || staff.username)}</div>
            <div className="detail-hero-copy">
              <div className="detail-kicker">Staff account</div>
              <h1>{staff.fullName || staff.username}</h1>
              <p>{staff.email}</p>
              <div className="detail-chip-row">
                <span className="status-badge status-success-light">{staff.roleCode || "INSTRUCTOR"}</span>
                <span className="detail-chip">userId: {staff.userId}</span>
                <span className="detail-chip">{selectedPermissions.length} quyền</span>
              </div>
            </div>
          </section>

          <div className="detail-shell">
            <section className="detail-panel">
              <div className="section-heading">
                <h2>Quyền truy cập</h2>
                <p>Danh sách quyền gán cho role instructor hiện tại. Các API staff backend đang dùng userId làm accountId.</p>
              </div>

              <div className="permissions-grid">
                {permissionOptions.map((permission) => (
                  <label key={permission.code} className={`permission-item ${selectedPermissions.includes(permission.code) ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={selectedPermissions.includes(permission.code)}
                      onChange={() => togglePermission(permission.code)}
                      disabled={saving}
                    />
                    <div className="permission-info">
                      <span className="text-label-md">{permission.name || permission.code}</span>
                      <span className="text-body-sm text-on-surface-variant">{permission.description || permission.code}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <aside className="detail-side">
              <section className="detail-panel">
                <div className="section-heading">
                  <h2>Thông tin user</h2>
                </div>
                <div className="detail-list compact">
                  <div className="detail-list-row"><span><UserRound size={16} /> Username</span><strong>{staff.username}</strong></div>
                  <div className="detail-list-row"><span><Mail size={16} /> Email</span><strong>{staff.email}</strong></div>
                  <div className="detail-list-row"><span><ShieldCheck size={16} /> Role</span><strong>{staff.roleCode || "INSTRUCTOR"}</strong></div>
                  <div className="detail-list-row"><span><Lock size={16} /> User ID</span><strong>{staff.userId}</strong></div>
                </div>
              </section>
            </aside>
          </div>
        </>
      ) : (
        <div className="card p-6">Không tìm thấy nhân sự.</div>
      )}
    </form>
  );
}
