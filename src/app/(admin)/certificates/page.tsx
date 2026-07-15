"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Folder, CheckCircle2, Ban, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Course, courseService } from "@/services/course.service";
import { Certificate, learningService } from "@/services/learning.service";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION } from "@/lib/permissions";
import "./certificates.css";

function statusClass(status: string) {
  if (status === "ISSUED") return "status-success-light";
  return "status-error-light";
}

export default function CertificatesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canListCertificates = hasPermission(PERMISSION.CERTIFICATE_MANAGE);
  const canVerifyCertificates = hasPermission(PERMISSION.CERTIFICATE_VERIFY);
  const canViewCourses = hasPermission(PERMISSION.COURSE_VIEW);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [keyword, setKeyword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(canListCertificates);
      setError("");

      const [certificateResult, courseResult] = await Promise.allSettled([
        canListCertificates
          ? learningService.getCertificates({ page: 0, size: 100 })
          : Promise.resolve(null),
        canViewCourses
          ? courseService.getCourses({ page: 0, size: 100 })
          : Promise.resolve(null),
      ] as const);

      if (cancelled) return;

      const errors: string[] = [];
      if (canListCertificates && certificateResult.status === "fulfilled") {
        setCertificates(certificateResult.value?.content || []);
      } else if (canListCertificates && certificateResult.status === "rejected") {
        setCertificates([]);
        errors.push(
          certificateResult.reason instanceof Error
            ? certificateResult.reason.message
            : "Không tải được chứng chỉ."
        );
      } else {
        setCertificates([]);
      }

      if (canViewCourses && courseResult.status === "fulfilled") {
        setCourses(courseResult.value?.content || []);
      } else if (canViewCourses && courseResult.status === "rejected") {
        setCourses([]);
        errors.push(
          courseResult.reason instanceof Error
            ? courseResult.reason.message
            : "Không tải được danh sách khóa học."
        );
      } else {
        setCourses([]);
      }

      setError(errors.join(" "));
      setLoading(false);
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [canListCertificates, canViewCourses]);

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
    if (!canVerifyCertificates || !verifyCode.trim()) return;
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
          <p className="text-body-md text-on-surface-variant mt-2">
            {canListCertificates && canVerifyCertificates
              ? "Theo dõi toàn bộ chứng chỉ đã cấp và xác minh nhanh bằng mã chứng chỉ."
              : canListCertificates
                ? "Theo dõi toàn bộ chứng chỉ đã cấp trong hệ thống."
                : "Xác minh trạng thái chứng chỉ bằng mã chứng chỉ."}
          </p>
        </div>
        {canListCertificates && (
          <div className="header-actions">
            <div className="search-wrapper card" style={{ padding: '0 12px', minWidth: '260px' }}>
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Tìm kiếm chứng chỉ..." className="form-input search-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </div>
          </div>
        )}
      </div>

      {canListCertificates && (
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-info">
              <span className="text-label-sm text-outline uppercase tracking-wide">TỔNG CHỨNG CHỈ</span>
              <span className="text-headline-lg mt-1 text-primary">{certificates.length}</span>
            </div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary)' }}><Folder size={20} color="#ffffff" /></div>
          </div>
          <div className="card stat-card" style={{ backgroundColor: '#f0fdf4' }}>
            <div className="stat-info">
              <span className="text-label-sm text-outline uppercase tracking-wide">ĐÃ CẤP</span>
              <span className="text-headline-lg mt-1" style={{ color: '#16a34a' }}>{certificates.filter((item) => item.status === "ISSUED").length}</span>
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
      )}

      {canVerifyCertificates && (
        <>
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
            <div className="card verify-result-card mt-4">
              <div>
                <span className={`status-badge ${statusClass(verifyResult.status)}`}>● {verifyResult.status}</span>
                <strong>{verifyResult.certificateCode}</strong>
                <p>{courseNameById[verifyResult.courseId] || verifyResult.courseId}</p>
              </div>
              <Link className="btn btn-secondary btn-sm" href={`/certificates/${encodeURIComponent(verifyResult.certificateCode)}`}>
                Xem chi tiết
              </Link>
            </div>
          )}
        </>
      )}
      {error && <div className="card p-4 mt-4 text-status-required">{error}</div>}

      {canListCertificates && (
        <div className="card table-card mt-4">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>Certificate Code</th>
                  <th style={{ width: '22%' }}>User ID</th>
                  <th style={{ width: '26%' }}>Khóa học</th>
                  <th style={{ width: '16%' }}>Ngày cấp</th>
                  <th style={{ width: '12%' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5}>Đang tải chứng chỉ...</td></tr>}
                {!loading && filteredCertificates.length === 0 && <tr><td colSpan={5}>Chưa có chứng chỉ phù hợp.</td></tr>}
                {!loading && filteredCertificates.map((certificate) => (
                  <tr
                    key={certificate.id}
                    className={canVerifyCertificates ? "clickable-row" : undefined}
                    onClick={canVerifyCertificates
                      ? () => router.push(`/certificates/${encodeURIComponent(certificate.certificateCode)}`)
                      : undefined}
                  >
                    <td className="text-label-md text-primary">{certificate.certificateCode}</td>
                    <td className="text-body-md text-on-surface-variant">{certificate.userId}</td>
                    <td className="text-body-md text-on-surface-variant">{courseNameById[certificate.courseId] || certificate.courseId}</td>
                    <td className="text-body-md text-on-surface-variant">{formatDate(certificate.issuedAt)}</td>
                    <td><span className={`status-badge ${statusClass(certificate.status)}`}>● {certificate.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span className="text-body-sm text-on-surface-variant">Hiển thị {filteredCertificates.length} chứng chỉ trong hệ thống.</span>
          </div>
        </div>
      )}
    </div>
  );
}
