"use client";

import "../../detail.css";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, UserRound, BookOpen, CalendarDays } from "lucide-react";
import { Course, courseService } from "@/services/course.service";
import { Enrollment, learningService } from "@/services/learning.service";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function EnrollmentDetailPage() {
  const params = useParams<{ id: string }>();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [enrollmentPage, coursePage] = await Promise.all([
          learningService.getMyCourses({ page: 0, size: 100 }),
          courseService.getCourses({ page: 0, size: 100 }),
        ]);
        setEnrollments(enrollmentPage.content || []);
        setCourses(coursePage.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được ghi danh.");
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

  const enrollment = enrollments.find((item) => item.id === params.id);

  return (
    <div className="page-container detail-page">
      <div className="detail-toolbar">
        <Link href="/enrollment" className="btn btn-ghost"><ArrowLeft size={18} /> Quay lại</Link>
      </div>

      {loading && <div className="card p-6">Đang tải ghi danh...</div>}
      {!loading && error && <div className="card p-6">{error}</div>}
      {!loading && !error && enrollment ? (
        <>
          <section className="detail-hero-card">
            <div className="detail-avatar">{enrollment.userId?.slice(0, 2).toUpperCase()}</div>
            <div className="detail-hero-copy">
              <div className="detail-kicker">Ghi danh khóa học</div>
              <h1>{courseNameById[enrollment.courseId] || enrollment.courseId}</h1>
              <p>{enrollment.userId}</p>
              <div className="detail-chip-row">
                <span className={enrollment.status === "COMPLETED" ? "status-badge status-success-light" : "status-badge status-pending-gray"}>{enrollment.status}</span>
                <span className="detail-chip">{enrollment.progressPercent ?? 0}% hoàn thành</span>
              </div>
            </div>
          </section>

          <div className="detail-summary-grid">
            <div className="metric-card"><UserRound size={18} /><span>User ID</span><strong>{enrollment.userId}</strong></div>
            <div className="metric-card"><BookOpen size={18} /><span>Khóa học</span><strong>{courseNameById[enrollment.courseId] || enrollment.courseId}</strong></div>
            <div className="metric-card"><CalendarDays size={18} /><span>Ngày đăng ký</span><strong>{formatDate(enrollment.enrolledAt)}</strong></div>
            <div className="metric-card"><CheckCircle2 size={18} /><span>Trạng thái</span><strong>{enrollment.status}</strong></div>
          </div>

          <section className="detail-panel">
            <div className="section-heading">
              <h2>Thông tin ghi danh</h2>
              <p>Chi tiết học viên và khóa học được đăng ký.</p>
            </div>
            <div className="detail-list">
              <div className="detail-list-row"><span>Enrollment ID</span><strong>{enrollment.id}</strong></div>
              <div className="detail-list-row"><span>User ID</span><strong>{enrollment.userId}</strong></div>
              <div className="detail-list-row"><span>Course ID</span><strong>{enrollment.courseId}</strong></div>
              <div className="detail-list-row"><span>Ngày hoàn thành</span><strong>{formatDate(enrollment.completedAt)}</strong></div>
              <div className="detail-list-row"><span>Tiến độ</span><strong>{enrollment.progressPercent ?? 0}%</strong></div>
            </div>
          </section>
        </>
      ) : !loading && !error ? (
        <div className="card p-6">Không tìm thấy ghi danh trong danh sách của tài khoản hiện tại.</div>
      ) : null}
    </div>
  );
}
