"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Hash,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Course, courseService } from "@/services/course.service";
import { Certificate, learningService } from "@/services/learning.service";
import { formatDateTime } from "@/lib/date";
import "../../detail.css";
import "../certificates.css";

export default function CertificateDetailPage() {
  const params = useParams<{ code: string }>();
  const certificateCode = params.code;
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const certificateData = await learningService.verifyCertificate(certificateCode);
        setCertificate(certificateData);
        const courseData = await courseService.getCourse(certificateData.courseId).catch(() => null);
        setCourse(courseData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chi tiết chứng chỉ.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [certificateCode]);

  const copyCode = async () => {
    if (!certificate) return;
    try {
      await navigator.clipboard.writeText(certificate.certificateCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const isIssued = certificate?.status === "ISSUED";

  return (
    <div className="page-container detail-page">
      <div className="detail-toolbar">
        <Link href="/certificates" className="btn btn-ghost">
          <ArrowLeft size={18} /> Quay lại danh sách
        </Link>
        {certificate && (
          <button type="button" className="btn btn-secondary" onClick={copyCode}>
            <Clipboard size={18} /> {copied ? "Đã sao chép" : "Sao chép mã"}
          </button>
        )}
      </div>

      {loading && <div className="card p-6">Đang tải chi tiết chứng chỉ...</div>}
      {!loading && error && <div className="card p-6 text-status-required">{error}</div>}

      {!loading && !error && certificate && (
        <>
          <section className="detail-hero-card">
            <div className="detail-avatar detail-avatar-course"><Award size={34} /></div>
            <div className="detail-hero-copy">
              <div className="detail-kicker">Chứng chỉ hoàn thành khóa học</div>
              <h1>{course?.name || "Chứng chỉ khóa học"}</h1>
              <p>Chứng nhận học viên đã đáp ứng đầy đủ điều kiện hoàn thành khóa học.</p>
              <div className="detail-chip-row">
                <span className={`status-badge ${isIssued ? "status-success-light" : "status-error-light"}`}>
                  ● {certificate.status}
                </span>
                <span className="certificate-code-display"><Hash size={16} /> {certificate.certificateCode}</span>
              </div>
            </div>
          </section>

          <div className="detail-summary-grid">
            <div className="metric-card"><UserRound size={18} /><span>Học viên</span><strong>{certificate.userId}</strong></div>
            <div className="metric-card"><BookOpen size={18} /><span>Khóa học</span><strong>{course?.name || certificate.courseId}</strong></div>
            <div className="metric-card"><CalendarDays size={18} /><span>Ngày cấp</span><strong>{formatDateTime(certificate.issuedAt)}</strong></div>
            <div className="metric-card"><ShieldCheck size={18} /><span>Trạng thái</span><strong>{certificate.status}</strong></div>
          </div>

          <div className="detail-shell">
            <section className="detail-panel">
              <div className="section-heading">
                <h2>Thông tin chứng chỉ</h2>
                <p>Các định danh liên kết giữa chứng chỉ, học viên, khóa học và ghi danh.</p>
              </div>
              <div className="detail-list">
                <div className="detail-list-row"><span><Award size={16} /> Certificate ID</span><strong>{certificate.id}</strong></div>
                <div className="detail-list-row"><span><Hash size={16} /> Mã chứng chỉ</span><strong>{certificate.certificateCode}</strong></div>
                <div className="detail-list-row"><span><UserRound size={16} /> User ID</span><strong>{certificate.userId}</strong></div>
                <div className="detail-list-row"><span><BookOpen size={16} /> Course ID</span><strong>{certificate.courseId}</strong></div>
                <div className="detail-list-row"><span><CalendarDays size={16} /> Thời gian cấp</span><strong>{formatDateTime(certificate.issuedAt)}</strong></div>
              </div>
            </section>

            <aside className="detail-side">
              <section className={`certificate-validity-card ${isIssued ? "" : "revoked"}`}>
                <div className="certificate-validity-icon">
                  {isIssued ? <CheckCircle2 size={26} /> : <ShieldCheck size={26} />}
                </div>
                <h2>{isIssued ? "Chứng chỉ hợp lệ" : "Chứng chỉ đã bị thu hồi"}</h2>
                <p>
                  {isIssued
                    ? "Mã chứng chỉ tồn tại trong hệ thống và đang ở trạng thái đã cấp."
                    : "Chứng chỉ tồn tại nhưng không còn được công nhận là chứng chỉ đang hiệu lực."}
                </p>
              </section>

              <section className="detail-panel">
                <div className="section-heading"><h2>Liên kết liên quan</h2></div>
                <div className="detail-list compact">
                  <div className="detail-list-row">
                    <span>Khóa học</span>
                    <strong><Link className="text-primary" href={`/courses/${certificate.courseId}`}>{course?.name || certificate.courseId}</Link></strong>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
