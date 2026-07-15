"use client";
/* eslint-disable @next/next/no-img-element -- Preview URLs can be local blobs. */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { CourseCategory, CourseLevel, CourseStatus, courseService } from "@/services/course.service";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION } from "@/lib/permissions";
import {
  clearCourseLocalDraft,
  loadCourseLocalDraft,
  saveCourseLocalDraft,
  type CourseLocalDraft,
  type DraftStorage,
} from "@/lib/course-local-draft";
import {
  canUseCourseCreationAction,
  getServerCourseDraftStatus,
  type CourseCreationAction,
} from "@/lib/course-creation-policy";
import "./new-course.css";

type CreationWarning = "image-upload" | "submit-review" | "post-create";

function getBrowserDraftStorage(): DraftStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function NewCoursePage() {
  const router = useRouter();
  const { hasPermission, user } = useAuth();
  const canManageCourses = hasPermission(PERMISSION.COURSE_MANAGE);
  const canSubmitReview = hasPermission(PERMISSION.COURSE_SUBMIT_REVIEW);
  const canReview = hasPermission(PERMISSION.COURSE_REVIEW);
  const canManageImages = hasPermission(PERMISSION.IMAGE_MANAGE);
  const canCreateServerDraft = canUseCourseCreationAction(
    "server-draft",
    canManageCourses,
    canSubmitReview,
    canReview,
  );
  const canCreateDraftAndSubmit = canUseCourseCreationAction(
    "submit-review",
    canManageCourses,
    canSubmitReview,
    canReview,
  );
  const canPublishDirectly = canUseCourseCreationAction(
    "publish",
    canManageCourses,
    canSubmitReview,
    canReview,
  );
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("BEGINNER");
  const [price, setPrice] = useState(0);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [activeAction, setActiveAction] = useState<CourseCreationAction | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [localDraftMessage, setLocalDraftMessage] = useState("");
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const loading = activeAction !== null;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const catalog = (await courseService.getCategoryCatalog()) || [];
        setCategories(catalog);

        const firstCategoryId = catalog?.[0]?.id || "";
        const storage = getBrowserDraftStorage();
        const localDraft = storage && user?.id
          ? loadCourseLocalDraft(storage, user.id)
          : { status: "empty" as const };

        if (localDraft.status === "found") {
          const restored = localDraft.draft;
          const categoryStillExists = catalog.some((category) => category.id === restored.categoryId);
          setName(restored.name);
          setCode(restored.code);
          setCategoryId(categoryStillExists ? restored.categoryId : firstCategoryId);
          setDescription(restored.description);
          setLevel(restored.level);
          setPrice(restored.price);
          setHasLocalDraft(true);
          setLocalDraftMessage(categoryStillExists || !restored.categoryId
            ? "Đã khôi phục bản lưu tạm trên trình duyệt. Thumbnail không được lưu, vui lòng chọn lại ảnh."
            : "Đã khôi phục bản lưu tạm; danh mục cũ không còn hợp lệ nên đã chọn danh mục hiện có. Thumbnail cần được chọn lại.");
        } else {
          setCategoryId(firstCategoryId);
          if (localDraft.status === "expired") {
            setLocalDraftMessage("Bản lưu tạm đã quá 7 ngày và được xóa tự động.");
          } else if (localDraft.status === "invalid") {
            setLocalDraftMessage("Bản lưu tạm không hợp lệ và đã được xóa.");
          } else if (localDraft.status === "unavailable") {
            setLocalDraftMessage("Trình duyệt đang chặn bộ nhớ cục bộ nên không thể khôi phục bản lưu tạm.");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh mục.");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [user?.id]);

  const thumbnailPreview = useMemo(() => {
    if (!thumbnail) return "";
    return URL.createObjectURL(thumbnail);
  }, [thumbnail]);

  useEffect(() => () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
  }, [thumbnailPreview]);

  const getDraftData = (): CourseLocalDraft => ({
    name,
    code,
    categoryId,
    description,
    level,
    price,
  });

  const handleSaveLocalDraft = () => {
    setError("");
    const storage = getBrowserDraftStorage();
    if (!storage || !user?.id || !saveCourseLocalDraft(storage, user.id, getDraftData())) {
      setError("Không thể lưu tạm trên trình duyệt. Hãy kiểm tra chế độ riêng tư hoặc quyền lưu trữ của trình duyệt.");
      return;
    }
    setHasLocalDraft(true);
    setLocalDraftMessage("Đã lưu tạm trên trình duyệt, không gọi API và không tạo bản ghi trong CSDL. Thumbnail không được lưu, bạn cần chọn lại ảnh khi quay lại.");
  };

  const handleClearLocalDraft = () => {
    setError("");
    const storage = getBrowserDraftStorage();
    if (!storage || !user?.id || !clearCourseLocalDraft(storage, user.id)) {
      setError("Không thể xóa bản lưu tạm khỏi trình duyệt.");
      return;
    }
    setHasLocalDraft(false);
    setLocalDraftMessage("Đã xóa bản lưu tạm khỏi trình duyệt. Dữ liệu đang nhập trên màn hình vẫn được giữ lại.");
  };

  const routeToCreatedCourse = (
    courseId: string,
    courseStatus: CourseStatus,
    intent: CourseCreationAction,
    warning?: CreationWarning,
    localDraftCleanupFailed = false,
  ) => {
    const query = new URLSearchParams({
      creationIntent: intent,
      creationStatus: courseStatus,
    });
    if (warning) query.set("creationWarning", warning);
    if (localDraftCleanupFailed) query.set("localDraftCleanup", "failed");
    router.replace(`/courses/${courseId}?${query.toString()}`);
    router.refresh();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedAction = submitter?.value || "server-draft";
    const action: CourseCreationAction = requestedAction === "submit-review" || requestedAction === "publish"
      ? requestedAction
      : "server-draft";

    if (!canUseCourseCreationAction(action, canManageCourses, canSubmitReview, canReview)) {
      setError(action === "publish"
        ? "Bạn cần cả quyền quản lý và quyền duyệt để xuất bản trực tiếp khóa học."
        : action === "submit-review"
          ? "Bạn chưa có quyền gửi duyệt khóa học."
          : "Bạn chưa có quyền tạo bản nháp khóa học trên hệ thống.");
      return;
    }

    const instructorId = user?.id || "";
    if (!instructorId) {
      setError("Không xác định được giảng viên từ phiên đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }
    if (!categoryId) {
      setError("Vui lòng tạo/chọn danh mục trước khi tạo khóa học.");
      return;
    }

    let createdCourseId = "";
    let createdCourseStatus: CourseStatus | null = null;
    let localDraftCleanupFailed = false;
    try {
      setActiveAction(action);
      const createdCourse = await courseService.createCourse({
        categoryId,
        instructorId,
        name,
        code,
        description,
        level,
        price: price || undefined,
        status: action === "publish"
          ? "PUBLISHED"
          : getServerCourseDraftStatus(canReview),
      });
      createdCourseId = createdCourse.id;
      createdCourseStatus = createdCourse.status;

      const storage = getBrowserDraftStorage();
      localDraftCleanupFailed = hasLocalDraft
        && (!storage || !clearCourseLocalDraft(storage, instructorId));
      setHasLocalDraft(false);

      if (thumbnail && canManageImages) {
        try {
          await courseService.uploadCourseImage(createdCourse.id, thumbnail);
        } catch {
          routeToCreatedCourse(createdCourse.id, createdCourse.status, action, "image-upload", localDraftCleanupFailed);
          return;
        }
      }

      if (action === "submit-review") {
        try {
          const submittedCourse = await courseService.submitForReview(createdCourse.id);
          routeToCreatedCourse(submittedCourse.id, submittedCourse.status, action, undefined, localDraftCleanupFailed);
          return;
        } catch {
          routeToCreatedCourse(createdCourse.id, createdCourse.status, action, "submit-review", localDraftCleanupFailed);
          return;
        }
      }

      routeToCreatedCourse(createdCourse.id, createdCourse.status, action, undefined, localDraftCleanupFailed);
    } catch (err) {
      if (createdCourseId && createdCourseStatus) {
        routeToCreatedCourse(createdCourseId, createdCourseStatus, action, "post-create", localDraftCleanupFailed);
      } else {
        setError(err instanceof Error ? err.message : "Không tạo được khóa học.");
      }
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '1100px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-titles">
          <h1 className="text-headline-lg">Thêm Khóa học mới</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            {canReview
              ? "Lưu tạm trên trình duyệt, tạo bản nháp quản trị, gửi duyệt hoặc xuất bản trực tiếp."
              : canSubmitReview
                ? "Bạn có thể lưu tạm không tạo dữ liệu, tạo bản nháp giảng viên riêng tư hoặc tạo và gửi duyệt ngay."
                : "Bạn có thể lưu tạm không tạo dữ liệu hoặc tạo bản nháp giảng viên riêng tư trên hệ thống."}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/courses')} disabled={loading}>Hủy</button>
        </div>
      </div>

      {error && (
        <div className="card p-6 mb-6" style={{ color: 'var(--on-error-container)', backgroundColor: 'var(--error-container)' }}>
          {error}
        </div>
      )}

      <div className="course-form-grid">
        <div className="form-left-col">
          <div className="card p-6 mb-6">
            <h3 className="text-headline-sm mb-4">Thông tin cơ bản</h3>
            <div className="form-group mb-4">
              <label className="text-label-md">
                Tên khóa học <span className="text-status-required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Nhập tên khóa học..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="text-label-md">
                  Mã khóa học <span className="text-status-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: JAVA-BE-101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="text-label-md">
                  Danh mục <span className="text-status-required">*</span>
                </label>
                <select
                  className="form-input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={loading || loadingCategories}
                >
                  <option value="">{loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục...'}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2 mt-4">
              <div className="form-group">
                <label className="text-label-md">Cấp độ</label>
                <select className="form-input" value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)} disabled={loading}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label className="text-label-md">Giá</label>
                <input type="number" min={0} className="form-input" value={price} onChange={(e) => setPrice(Number(e.target.value))} disabled={loading} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Mô tả khóa học</h3>
            <div className="editor-container border rounded">
              <div className="editor-toolbar border-b p-2 flex gap-2 bg-surface-container-lowest">
                <button type="button" className="editor-btn font-bold">B</button>
                <button type="button" className="editor-btn italic">I</button>
                <button type="button" className="editor-btn underline">U</button>
                <div className="divider"></div>
                <button type="button" className="editor-btn">List</button>
              </div>
              <textarea
                className="editor-textarea p-4"
                placeholder="Nhập mô tả chi tiết về khóa học, mục tiêu, đối tượng..."
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="form-right-col">
          {canManageImages && <div className="card p-6 mb-6">
            <h3 className="text-headline-sm mb-4">Ảnh Thumbnail</h3>
            <label className="upload-area">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Course thumbnail preview" className="thumbnail-preview" />
              ) : (
                <>
                  <div className="upload-icon-wrapper bg-primary-fixed">
                    <UploadCloud size={32} className="text-primary" />
                  </div>
                  <p className="text-body-md mt-4 text-center">
                    <strong className="text-primary cursor-pointer">Nhấn để tải lên</strong><br/>
                    hoặc kéo thả ảnh vào đây
                  </p>
                  <p className="text-body-sm text-outline mt-2 text-center">
                    PNG, JPG, GIF up to 5MB<br/>
                    Khuyến nghị: 1280×720px
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </label>
            {thumbnail && <p className="text-body-sm text-outline mt-2">Đã chọn: {thumbnail.name}</p>}
          </div>}

          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Lưu tạm trên trình duyệt</h3>
            <p className="text-body-sm text-outline local-draft-description">
              Không gọi API, không tạo bản ghi trong CSDL và chỉ áp dụng cho tài khoản đang đăng nhập trên trình duyệt này. Thumbnail không được lưu và phải chọn lại.
            </p>
            {localDraftMessage && <div className="local-draft-message">{localDraftMessage}</div>}
            <div className="local-draft-actions">
              <button type="button" className="btn btn-ghost" onClick={handleSaveLocalDraft} disabled={loading}>
                Chỉ lưu tạm trên trình duyệt
              </button>
              {hasLocalDraft && (
                <button type="button" className="btn btn-ghost" onClick={handleClearLocalDraft} disabled={loading}>
                  Xóa bản lưu tạm
                </button>
              )}
            </div>
          </div>

          <div className="card p-6 mt-4">
            <h3 className="text-headline-sm mb-4">Tạo khóa học trên hệ thống</h3>
            <p className="text-body-sm text-outline server-draft-description">
              Các lựa chọn dưới đây đều tạo bản ghi trong CSDL. Nếu bạn không có quyền duyệt, bản ghi được lưu ở trạng thái Bản nháp giảng viên và chỉ vào danh sách của quản trị viên sau khi gửi duyệt thành công.
            </p>
            {(canCreateServerDraft || canCreateDraftAndSubmit || canPublishDirectly) && (
              <div className="course-create-actions">
                {canCreateServerDraft && (
                  <button type="submit" name="creationAction" value="server-draft" className="btn btn-secondary" disabled={loading || loadingCategories}>
                    {activeAction === "server-draft" ? "Đang tạo bản nháp..." : canReview ? "Tạo bản nháp quản trị (DB)" : "Tạo bản nháp giảng viên (DB)"}
                  </button>
                )}
                {canCreateDraftAndSubmit && (
                  <button type="submit" name="creationAction" value="submit-review" className="btn btn-primary" disabled={loading || loadingCategories}>
                    {activeAction === "submit-review" ? "Đang tạo & gửi duyệt..." : "Tạo khóa học & gửi duyệt"}
                  </button>
                )}
                {canPublishDirectly && (
                  <button type="submit" name="creationAction" value="publish" className="btn btn-primary" disabled={loading || loadingCategories}>
                    {activeAction === "publish" ? "Đang tạo & xuất bản..." : "Tạo & xuất bản ngay"}
                  </button>
                )}
              </div>
            )}
            <p className="text-body-sm text-outline action-permission-note">
              {canSubmitReview
                ? "Nút gửi duyệt hiển thị vì bạn có quyền COURSE_SUBMIT_REVIEW. Khóa học chỉ chuyển sang Chờ duyệt sau khi thao tác này thành công."
                : "Bạn chưa có quyền COURSE_SUBMIT_REVIEW nên nút gửi duyệt không hiển thị."}
              {canReview && " Người có quyền duyệt và quản lý khóa học có thể xuất bản trực tiếp."}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
