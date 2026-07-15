
"use client";
/* eslint-disable @next/next/no-img-element -- Preview URLs can be local blobs or authenticated API resources. */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";
import { CourseCategory, CourseLevel, CourseStatus, courseService } from "@/services/course.service";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION } from "@/lib/permissions";
import { getCourseStatusDescription, getCourseStatusLabel } from "@/lib/course-status";
import "../../new/new-course.css";

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canReview = hasPermission(PERMISSION.COURSE_REVIEW);
  const canManageImages = hasPermission(PERMISSION.IMAGE_MANAGE);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("BEGINNER");
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<CourseStatus>("DRAFT");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [course, categoryPage] = await Promise.all([
          courseService.getCourse(params.id),
          courseService.getCategoryCatalog(),
        ]);
        setCategories(categoryPage || []);
        setCategoryId(course.categoryId || "");
        setInstructorId(course.instructorId || "");
        setName(course.name || "");
        setCode(course.code || "");
        setDescription(course.description || "");
        setLevel(course.level || "BEGINNER");
        setPrice(course.price || 0);
        setStatus(course.status || "DRAFT");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được khóa học.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const thumbnailPreview = useMemo(() => {
    if (!thumbnail) return "";
    return URL.createObjectURL(thumbnail);
  }, [thumbnail]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      setSaving(true);
      await courseService.updateCourse(params.id, {
        categoryId,
        instructorId,
        name,
        code,
        description,
        level,
        price: price || undefined,
        status,
      });
      if (thumbnail && canManageImages) {
        await courseService.uploadCourseImage(params.id, thumbnail);
      }
      router.push('/courses');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được khóa học.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '1100px' }}>
      <div className="page-header">
        <div className="header-titles flex-center gap-4">
          <Link href="/courses" className="icon-btn text-outline"><ArrowLeft size={22} /></Link>
          <div>
            <h1 className="text-headline-lg">Sửa khóa học</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Cập nhật thông tin và thumbnail khóa học.</p>
          </div>
        </div>
        <div className="header-actions">
          <Link href="/courses" className="btn btn-ghost">Hủy</Link>
          <button type="submit" className="btn btn-primary" disabled={saving || loading}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </div>

      {error && <div className="card p-6 mb-6" style={{ color: 'var(--on-error-container)', backgroundColor: 'var(--error-container)' }}>{error}</div>}

      {loading ? (
        <div className="card p-6">Đang tải...</div>
      ) : (
        <div className="course-form-grid">
          <div className="form-left-col">
            <div className="card p-6 mb-6">
              <h3 className="text-headline-sm mb-4">Thông tin cơ bản</h3>
              <div className="form-group mb-4">
                <label className="text-label-md">Tên khóa học *</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="text-label-md">Mã khóa học *</label>
                  <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} required disabled={saving} />
                </div>
                <div className="form-group">
                  <label className="text-label-md">Danh mục *</label>
                  <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={saving}>
                    {!categories.some((category) => category.id === categoryId) && categoryId && (
                      <option value={categoryId}>{categoryId}</option>
                    )}
                    {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid-2 mt-4">
                <div className="form-group">
                  <label className="text-label-md">Cấp độ</label>
                  <select className="form-input" value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)} disabled={saving}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-label-md">Giá</label>
                  <input type="number" min={0} className="form-input" value={price} onChange={(e) => setPrice(Number(e.target.value))} disabled={saving} />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-headline-sm mb-4">Mô tả khóa học</h3>
              <textarea className="editor-textarea p-4" rows={10} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
            </div>
          </div>

          <div className="form-right-col">
            {canManageImages && <div className="card p-6 mb-6">
              <h3 className="text-headline-sm mb-4">Ảnh Thumbnail mới</h3>
              <label className="upload-area">
                {thumbnailPreview ? <img src={thumbnailPreview} alt="Course thumbnail preview" className="thumbnail-preview" /> : <><div className="upload-icon-wrapper bg-primary-fixed"><UploadCloud size={32} className="text-primary" /></div><p className="text-body-md mt-4 text-center"><strong className="text-primary cursor-pointer">Chọn ảnh mới</strong></p></>}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setThumbnail(e.target.files?.[0] || null)} disabled={saving} />
              </label>
              {thumbnail && <p className="text-body-sm text-outline mt-2">Đã chọn: {thumbnail.name}</p>}
            </div>}
            <div className="card p-6">
              <h3 className="text-headline-sm mb-4">Trạng thái</h3>
              {canReview ? <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as CourseStatus)} disabled={saving}>
                <option value="INSTRUCTOR_DRAFT" disabled>Bản nháp giảng viên (riêng tư)</option>
                <option value="DRAFT">Bản nháp quản trị</option>
                <option value="PENDING_REVIEW">Chờ duyệt</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </select> : <strong>{getCourseStatusLabel(status)}</strong>}
              <p className="text-body-sm text-outline mt-2">{getCourseStatusDescription(status)}</p>
              {!canReview && status === "INSTRUCTOR_DRAFT" && (
                <p className="text-body-sm text-outline mt-2">Sau khi hoàn thiện, dùng nút Gửi duyệt ở trang chi tiết. Quản trị viên chỉ nhận khóa học khi trạng thái chuyển sang Chờ duyệt.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
