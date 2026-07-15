"use client";

import "../../detail.css";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, BookOpen, DollarSign, Tag, UserRound, Layers3 } from "lucide-react";
import { Course, CourseCategory, courseService } from "@/services/course.service";
import HasPermission from "@/components/HasPermission";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION } from "@/lib/permissions";
import {
  canSubmitCourseForReview,
  getCourseStatusClass,
  getCourseStatusDescription,
  getCourseStatusLabel,
  isCourseStatus,
} from "@/lib/course-status";

function infoValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "-";
  return value;
}

function formatPrice(value?: number) {
  if (!value) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(value);
}

type CreationIntent = "server-draft" | "submit-review" | "publish";
type CreationFeedback = { tone: "success" | "warning"; title: string; message: string };

function getCreationFeedback(
  intent: string | null,
  warning: string | null,
  statusValue: string | null,
): CreationFeedback | null {
  const status = isCourseStatus(statusValue) ? statusValue : null;
  const statusLabel = status ? getCourseStatusLabel(status) : "bản nháp trên hệ thống";

  if (warning === "image-upload") {
    if (intent === "publish") {
      return {
        tone: "warning",
        title: "Khóa học đã được tạo và xuất bản, nhưng chưa có thumbnail",
        message: "Bản ghi đã tồn tại trong CSDL. Không tạo lại khóa học; hãy mở Sửa khóa học để tải lại thumbnail.",
      };
    }
    return {
      tone: "warning",
      title: "Khóa học đã được tạo trong CSDL, nhưng tải thumbnail thất bại",
      message: intent === "submit-review"
        ? `Khóa học đang ở trạng thái ${statusLabel} và chưa được gửi duyệt. Không tạo lại; hãy tải lại thumbnail trong trang sửa rồi bấm Gửi duyệt tại đây.`
        : `${statusLabel} đã tồn tại. Không tạo lại khóa học; hãy mở trang sửa để tải lại thumbnail.`,
    };
  }
  if (warning === "submit-review") {
    return {
      tone: "warning",
      title: "Đã tạo khóa học nhưng chưa gửi duyệt được",
      message: `Bản ghi ${statusLabel} và thumbnail (nếu có) đã được lưu trong CSDL. Không tạo lại khóa học; hãy bấm Gửi duyệt tại trang này để thử lại.`,
    };
  }
  if (warning === "post-create") {
    return {
      tone: "warning",
      title: "Khóa học đã được tạo nhưng bước hoàn tất gặp lỗi",
      message: "Bản ghi đã tồn tại trong CSDL. Không tạo lại khóa học; hãy kiểm tra trạng thái bên dưới và tiếp tục từ trang chi tiết này.",
    };
  }

  const validIntent = intent as CreationIntent | null;
  if (validIntent === "server-draft") {
    return {
      tone: "success",
      title: "Đã tạo bản nháp trên hệ thống",
      message: status
        ? `Khóa học đã có bản ghi ${statusLabel} trong CSDL. ${getCourseStatusDescription(status)}`
        : "Khóa học đã có bản ghi trong CSDL. Bạn có thể thêm bài học, tài nguyên hoặc gửi duyệt khi sẵn sàng.",
    };
  }
  if (validIntent === "submit-review") {
    return {
      tone: "success",
      title: "Đã tạo và gửi duyệt khóa học",
      message: "Khóa học đã được chuyển sang trạng thái chờ duyệt.",
    };
  }
  if (validIntent === "publish") {
    return {
      tone: "success",
      title: "Đã tạo và xuất bản khóa học",
      message: "Khóa học đã được tạo trực tiếp ở trạng thái công khai.",
    };
  }
  return null;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, user } = useAuth();
  const canViewCategories = hasPermission(PERMISSION.CATEGORY_VIEW);
  const canSubmitReview = hasPermission(PERMISSION.COURSE_SUBMIT_REVIEW);
  const canReviewCourses = hasPermission(PERMISSION.COURSE_REVIEW);
  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [creationFeedback, setCreationFeedback] = useState<CreationFeedback | null>(() =>
    getCreationFeedback(
      searchParams.get("creationIntent"),
      searchParams.get("creationWarning"),
      searchParams.get("creationStatus"),
    )
  );
  const [localDraftCleanupFailed] = useState(
    () => searchParams.get("localDraftCleanup") === "failed"
  );
  const canSubmitOwnedCourse = Boolean(
    canSubmitReview && course && user?.id && course.instructorId === user.id
  );

  useEffect(() => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    const hasCreationResult = nextSearchParams.has("creationIntent")
      || nextSearchParams.has("creationWarning")
      || nextSearchParams.has("creationStatus")
      || nextSearchParams.has("localDraftCleanup");
    if (!hasCreationResult) return;
    nextSearchParams.delete("creationIntent");
    nextSearchParams.delete("creationWarning");
    nextSearchParams.delete("creationStatus");
    nextSearchParams.delete("localDraftCleanup");
    const query = nextSearchParams.toString();
    router.replace(`/courses/${params.id}${query ? `?${query}` : ""}`, { scroll: false });
  }, [params.id, router, searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [courseData, categoryPage] = await Promise.all([
          courseService.getCourse(params.id),
          canViewCategories ? courseService.getCategories({ page: 0, size: 100 }) : null,
        ]);
        setCourse(courseData);
        setCategories(categoryPage?.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chi tiết khóa học.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [canViewCategories, params.id]);

  const categoryName = useMemo(() => {
    if (!course) return "-";
    return categories.find((category) => category.id === course.categoryId)?.name || course.categoryId || "-";
  }, [categories, course]);

  const updateCourseStatus = async (action: "submit" | "approve") => {
    if (!course || (action === "submit" ? !canSubmitOwnedCourse : !canReviewCourses)) return;
    try {
      setActionLoading(true);
      setError("");
      const updated = action === "submit"
        ? await courseService.submitForReview(course.id)
        : await courseService.approveCourse(course.id);
      setCourse(updated);
      setCreationFeedback(null);
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
            {canSubmitOwnedCourse && canSubmitCourseForReview(course.status) && <HasPermission required={PERMISSION.COURSE_SUBMIT_REVIEW}><button className="btn btn-primary" onClick={() => updateCourseStatus("submit")} disabled={actionLoading}>{actionLoading ? "Đang gửi..." : "Gửi duyệt"}</button></HasPermission>}
            {course.status === "PENDING_REVIEW" && <HasPermission required={PERMISSION.COURSE_REVIEW}><button className="btn btn-primary" onClick={() => updateCourseStatus("approve")} disabled={actionLoading}>{actionLoading ? "Đang duyệt..." : "Duyệt & xuất bản"}</button></HasPermission>}
            <HasPermission required={PERMISSION.COURSE_MANAGE}><Link href={`/courses/${course.id}/edit`} className="btn btn-primary"><Edit size={18} /> Sửa khóa học</Link></HasPermission>
          </div>
        )}
      </div>

      {error && <div className="card p-6 mb-6" style={{ color: "var(--on-error-container)", backgroundColor: "var(--error-container)" }}>{error}</div>}

      {creationFeedback && (
        <div className={`creation-feedback ${creationFeedback.tone}`}>
          <strong>{creationFeedback.title}</strong>
          <span>{creationFeedback.message}</span>
        </div>
      )}

      {localDraftCleanupFailed && (
        <div className="creation-feedback warning">
          <strong>Không thể xóa bản lưu tạm trên trình duyệt</strong>
          <span>Khóa học trên hệ thống đã được tạo. Khi mở trang tạo mới, hãy xóa bản lưu tạm cũ để tránh dùng lại dữ liệu này.</span>
        </div>
      )}

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
                <span className={`status-badge ${getCourseStatusClass(course.status)}`}>{getCourseStatusLabel(course.status)}</span>
                <span className="detail-chip">{course.code}</span>
                <span className="detail-chip">{categoryName}</span>
              </div>
            </div>
          </section>

          {course.status === "INSTRUCTOR_DRAFT" && (
            <div className="creation-feedback warning">
              <strong>Bản nháp riêng của giảng viên</strong>
              <span>Khóa học chưa được gửi cho quản trị viên. Chỉ sau khi Gửi duyệt thành công và chuyển sang Chờ duyệt, khóa học mới xuất hiện trong danh sách cần duyệt.</span>
            </div>
          )}

          <div className="detail-summary-grid">
            <div className="metric-card"><Tag size={18} /><span>Cấp độ</span><strong>{infoValue(course.level)}</strong></div>
            <div className="metric-card"><Layers3 size={18} /><span>Danh mục</span><strong>{categoryName}</strong></div>
            <div className="metric-card"><DollarSign size={18} /><span>Giá</span><strong>{formatPrice(course.price)}</strong></div>
            <div className="metric-card"><BookOpen size={18} /><span>Trạng thái</span><strong>{getCourseStatusLabel(course.status)}</strong></div>
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
                  <div className="detail-list-row"><span>Quy trình hiện tại</span><strong>{getCourseStatusDescription(course.status)}</strong></div>
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
