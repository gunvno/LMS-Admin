"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search, Folder, Clock, CheckCircle2, Ban, ShieldCheck } from "lucide-react";
import { Course, courseService } from "@/services/course.service";
import { Certificate, learningService } from "@/services/learning.service";
import "./certificates.css";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function statusClass(status: string) {
  if (status === "ACTIVE") return "status-success-light";
  if (status === "EXPIRED") return "status-pending";
  return "status-error-light";
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [keyword, setKeyword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [certificatePage, coursePage] = await Promise.all([
          learningService.getMyCertificates({ page: 0, size: 100 }),
          courseService.getCourses({ page: 0, size: 100 }),
        ]);
        setCertificates(certificatePage.content || []);
        setCourses(coursePage.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chứng chỉ.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const courseNameById = useMemo(() => {
    return courses.reduce<Record<string, string>>((acc, course) => {
      acc[course.id] = course.name;
      return acc;
    }, {});
  }, [courses]);

  const filteredCertificates = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return certificates.filter((certificate) => !term || [
      certificate.userId,
      certificate.certificateCode,
      certificate.courseId,
      courseNameById[certificate.courseId],
      certificate.status,
    ].some((value) => value?.toLowerCase().includes(term)));
  }, [certificates, keyword, courseNameById]);

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    try {
      setVerifying(true);
      setError("");
      const result = await learningService.verifyCertificate(verifyCode.trim());
      setVerifyResult(result);
    } catch (err) {
      setVerifyResult(null);
      setError(err instanceof Error ? err.message : "Không xác minh được chứng chỉ.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Quản lý Chứng chỉ</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Xem chứng chỉ của tài khoản hiện tại và xác minh chứng chỉ theo mã.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary action-btn"><Filter size={18} /> Lọc</button>
          <div className="search-wrapper card" style={{ padding: '0 12px', minWidth: '260px' }}>
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Tìm kiếm chứng chỉ..." className="form-input search-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <span className="text-label-sm text-outline uppercase tracking-wide">TỔNG CHỨNG CHỈ</span>
            <span className="text-headline-lg mt-1 text-primary">{certificates.length}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary)' }}><Folder size={20} color="#ffffff" /></div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#fef3f2' }}>
          <div className="stat-info">
            <span className="text-label-sm text-outline uppercase tracking-wide">HẾT HẠN</span>
            <span className="text-headline-lg mt-1" style={{ color: '#ea580c' }}>{certificates.filter((item) => item.status === "EXPIRED").length}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#ffedd5' }}><Clock size={20} color="#ea580c" /></div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#f0fdf4' }}>
          <div className="stat-info">
            <span className="text-label-sm text-outline uppercase tracking-wide">CÒN HIỆU LỰC</span>
            <span className="text-headline-lg mt-1" style={{ color: '#16a34a' }}>{certificates.filter((item) => item.status === "ACTIVE").length}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}><CheckCircle2 size={20} color="#16a34a" /></div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#fef2f2' }}>
          <div className="stat-info">
            <span className="text-label-sm text-outline uppercase tracking-wide">ĐÃ THU HỒI</span>
            <span className="text-headline-lg mt-1" style={{ color: '#dc2626' }}>{certificates.filter((item) => item.status === "REVOKED").length}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2' }}><Ban size={20} color="#dc2626" /></div>
        </div>
      </div>

      <div className="list-section-header">
        <div>
          <h2 className="text-headline-sm">Xác minh chứng chỉ</h2>
          <p className="text-body-sm text-outline mt-1">Nhập mã dạng LMS-2026-A91F3C7B để kiểm tra trạng thái.</p>
        </div>
        <div className="header-actions">
          <input className="form-input" style={{ minWidth: 260 }} placeholder="Nhập certificate code..." value={verifyCode} onChange={(event) => setVerifyCode(event.target.value)} />
          <button className="btn btn-primary action-btn" onClick={handleVerify} disabled={verifying}><ShieldCheck size={18} /> {verifying ? "Đang xác minh..." : "Xác minh"}</button>
        </div>
      </div>

      {verifyResult && (
        <div className="card p-4 mt-4">
          <strong>Kết quả:</strong> {verifyResult.certificateCode} - {verifyResult.status} - Course {courseNameById[verifyResult.courseId] || verifyResult.courseId}
        </div>
      )}
      {error && <div className="card p-4 mt-4 text-status-required">{error}</div>}

      <div className="card table-card mt-4">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Certificate Code</th>
                <th style={{ width: '20%' }}>User ID</th>
                <th style={{ width: '24%' }}>Khóa học</th>
                <th style={{ width: '14%' }}>Ngày cấp</th>
                <th style={{ width: '12%' }}>Trạng thái</th>
                <th style={{ width: '8%' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}>Đang tải chứng chỉ...</td></tr>}
              {!loading && filteredCertificates.length === 0 && <tr><td colSpan={6}>Chưa có chứng chỉ phù hợp.</td></tr>}
              {!loading && filteredCertificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td className="text-label-md text-primary">{certificate.certificateCode}</td>
                  <td className="text-body-md text-on-surface-variant">{certificate.userId}</td>
                  <td className="text-body-md text-on-surface-variant">{courseNameById[certificate.courseId] || certificate.courseId}</td>
                  <td className="text-body-md text-on-surface-variant">{formatDate(certificate.issuedAt)}</td>
                  <td><span className={`status-badge ${statusClass(certificate.status)}`}>● {certificate.status}</span></td>
                  <td><button className="btn btn-secondary btn-sm" style={{ border: 'none', color: 'var(--outline)' }} onClick={() => setVerifyCode(certificate.certificateCode)}>Xem</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="text-body-sm text-on-surface-variant">Hiển thị {filteredCertificates.length} chứng chỉ. Backend hiện có API my-certificates và verify theo code.</span>
        </div>
      </div>
    </div>
  );
}
