"use client";

import "../../detail.css";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, BookOpen, DollarSign, Tag, UserRound, Layers3 } from "lucide-react";
import { Course, CourseCategory, courseService } from "@/services/course.service";
import HasPermission from "@/components/HasPermission";
import { useAuth } from "@/contexts/AuthContext";

function infoValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "-";
  return value;
}

function formatPrice(value?: number) {
  if (!value) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [courseData, categoryPage] = await Promise.all([
          courseService.getCourse(params.id),
          courseService.getCategories({ page: 0, size: 100 }),
        ]);
        setCourse(courseData);
        setCategories(categoryPage.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chi tiết khóa học.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const categoryName = useMemo(() => {
    if (!course) return "-";
    return categories.find((category) => category.id === course.categoryId)?.name || course.categoryId || "-";
  }, [categories, course]);

  const updateCourseStatus = async (action: "submit" | "approve") => {
    if (!course) return;
    try {
      setActionLoading(true);
      setError("");
      const updated = action === "submit"
        ? await courseService.submitForReview(course.id)
        : await courseService.approveCourse(course.id);
      setCourse(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái khóa học.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container detail-page">
      <div className="detail-toolbar">
        <Link href="/courses" className="btn btn-ghost"><ArrowLeft size={18} /> Quay lại</Link>
        {course && (
          <div className="header-actions">
            {!isAdmin && (course.status === "DRAFT" || course.status === "REJECTED") && <HasPermission required="COURSE_MANAGE"><button className="btn btn-primary" onClick={() => updateCourseStatus("submit")} disabled={actionLoading}>{actionLoading ? "Đang gửi..." : "Gửi duyệt"}</button></HasPermission>}
            {isAdmin && course.status === "PENDING_REVIEW" && <HasPermission required="COURSE_REVIEW"><button className="btn btn-primary" onClick={() => updateCourseStatus("approve")} disabled={actionLoading}>{actionLoading ? "Đang duyệt..." : "Duyệt & xuất bản"}</button></HasPermission>}
            <HasPermission required="COURSE_MANAGE"><Link href={`/courses/${course.id}/edit`} className="btn btn-primary"><Edit size={18} /> Sửa khóa học</Link></HasPermission>
          </div>
        )}
      </div>

      {error && <div className="card p-6 mb-6" style={{ color: "var(--on-error-container)", backgroundColor: "var(--error-container)" }}>{error}</div>}

      {loading ? (
        <div className="card p-6">Đang tải...</div>
      ) : course ? (
        <>
          <section className="detail-hero-card">
            <div className="detail-avatar detail-avatar-course">{course.name?.slice(0, 1).toUpperCase() || "C"}</div>
            <div className="detail-hero-copy">
              <div className="detail-kicker">Khóa học</div>
              <h1>{course.name}</h1>
              <p>{course.description || "Chưa có mô tả ngắn cho khóa học này."}</p>
              <div className="detail-chip-row">
                <span className="status-badge status-success-light">{course.status}</span>
                <span className="detail-chip">{course.code}</span>
                <span className="detail-chip">{categoryName}</span>
              </div>
            </div>
          </section>

          <div className="detail-summary-grid">
            <div className="metric-card"><Tag size={18} /><span>Cấp độ</span><strong>{infoValue(course.level)}</strong></div>
            <div className="metric-card"><Layers3 size={18} /><span>Danh mục</span><strong>{categoryName}</strong></div>
            <div className="metric-card"><DollarSign size={18} /><span>Giá</span><strong>{formatPrice(course.price)}</strong></div>
            <div className="metric-card"><BookOpen size={18} /><span>Trạng thái</span><strong>{course.status}</strong></div>
          </div>

          <div className="detail-shell">
            <section className="detail-panel">
              <div className="section-heading">
                <h2>Thông tin cơ bản</h2>
                <p>Những dữ liệu định danh dùng để liên kết course với các module khác.</p>
              </div>
              <div className="detail-list">
                <div className="detail-list-row"><span>ID</span><strong>{course.id}</strong></div>
                <div className="detail-list-row"><span>Mã khóa học</span><strong>{course.code}</strong></div>
                <div className="detail-list-row"><span>Danh mục</span><strong>{categoryName}</strong></div>
                <div className="detail-list-row"><span>Instructor ID</span><strong>{infoValue(course.instructorId)}</strong></div>
              </div>
            </section>

            <aside className="detail-side">
              <section className="detail-panel">
                <div className="section-heading">
                  <h2>Xuất bản</h2>
                  <p>Thông tin duyệt và trạng thái publish.</p>
                </div>
                <div className="detail-list compact">
                  <div className="detail-list-row"><span>Published at</span><strong>{infoValue(course.publishedAt)}</strong></div>
                  <div className="detail-list-row"><span>Lý do từ chối</span><strong>{infoValue(course.rejectReason)}</strong></div>
                </div>
              </section>

              <section className="detail-panel">
                <div className="section-heading">
                  <h2>Liên kết</h2>
                </div>
                <div className="detail-list compact">
                  <div className="detail-list-row"><span><Layers3 size={16} /> Category</span><strong>{categoryName}</strong></div>
                  <div className="detail-list-row"><span><UserRound size={16} /> Instructor</span><strong>{infoValue(course.instructorId)}</strong></div>
                </div>
              </section>
            </aside>
          </div>
        </>
      ) : (
        <div className="card p-6">Không tìm thấy khóa học.</div>
      )}
    </div>
  );
}
