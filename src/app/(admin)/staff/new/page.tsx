"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { authorService } from "@/services/author.service";
import "./new-staff.css";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "Staff" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

export default function NewStaffPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("123456");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const { firstName, lastName } = splitName(fullName);
    const finalUsername = username.trim() || email.split("@")[0];

    try {
      setSaving(true);
      await authorService.createStaffAccount({
        username: finalUsername,
        email,
        password,
        firstName,
        lastName,
        phone,
      });
      router.replace("/staff");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được nhân sự.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '900px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-titles flex-center gap-4">
          <Link href="/staff" className="icon-btn text-outline">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-headline-lg">Thêm Nhân Sự Mới</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Tạo user mới và gán role INSTRUCTOR.</p>
          </div>
        </div>
      </div>

      {error && <div className="card p-6 mb-6" style={{ color: "var(--on-error-container)", backgroundColor: "var(--error-container)" }}>{error}</div>}

      <div className="card new-staff-form p-8">
        <section className="form-section">
          <h3 className="text-headline-sm mb-4">Thông tin tài khoản</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="text-label-md">Họ và tên <span className="text-status-required">*</span></label>
              <input type="text" className="form-input" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="VD: Nguyễn Văn A" required disabled={saving} />
            </div>
            <div className="form-group">
              <label className="text-label-md">Địa chỉ Email <span className="text-status-required">*</span></label>
              <input type="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="instructor@gmail.com" required disabled={saving} />
            </div>
            <div className="form-group">
              <label className="text-label-md">Số điện thoại</label>
              <input type="tel" className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Nhập số điện thoại liên hệ" disabled={saving} />
            </div>
            <div className="form-group">
              <label className="text-label-md">Username</label>
              <input type="text" className="form-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Bỏ trống để lấy từ email" disabled={saving} />
            </div>
            <div className="form-group">
              <label className="text-label-md">Mật khẩu tạm</label>
              <input type="text" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="123456" disabled={saving} />
            </div>
          </div>
        </section>

        <section className="form-section mt-8">
          <h3 className="text-headline-sm mb-4">Vai trò</h3>
          <div className="role-card checked">
            <div className="role-card-content">
              <span className="text-label-md">Giảng viên / Instructor</span>
              <span className="text-body-sm text-outline mt-1">Backend sẽ tự gán role INSTRUCTOR cho userId vừa tạo.</span>
            </div>
          </div>
        </section>

        <div className="form-footer mt-8">
          <Link href="/staff" className="btn btn-ghost">Hủy bỏ</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Đang tạo..." : "Thêm Nhân sự"}</button>
        </div>
      </div>
    </form>
  );
}
