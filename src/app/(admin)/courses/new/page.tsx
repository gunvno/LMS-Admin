"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { getCookie } from "@/lib/api-client";
import { CourseCategory, CourseLevel, CourseStatus, courseService } from "@/services/course.service";
import { useAuth } from "@/contexts/AuthContext";
import "./new-course.css";

function decodeJwtSubject(token: string | null) {
  if (!token) return "";
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    const parsed = JSON.parse(json);
    return parsed.sub || "";
  } catch {
    return "";
  }
}

export default function NewCoursePage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("BEGINNER");
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<CourseStatus>("DRAFT");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const page = await courseService.getCategories({ page: 0, size: 100 });
        setCategories(page.content || []);
        if (page.content?.[0]) {
          setCategoryId(page.content[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh mục.");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const thumbnailPreview = useMemo(() => {
    if (!thumbnail) return "";
    return URL.createObjectURL(thumbnail);
  }, [thumbnail]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const instructorId = decodeJwtSubject(getCookie('auth_token'));
    if (!instructorId) {
      setError("Không xác định được instructorId từ phiên đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }
    if (!categoryId) {
      setError("Vui lòng tạo/chọn danh mục trước khi tạo khóa học.");
      return;
    }

    try {
      setLoading(true);
      const createdCourse = await courseService.createCourse({
        categoryId,
        instructorId,
        name,
        code,
        description,
        level,
        price: price || undefined,
        status: isAdmin ? status : "DRAFT",
      });

      if (thumbnail) {
        await courseService.uploadCourseImage(createdCourse.id, thumbnail);
      }

      router.replace('/courses');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được khóa học.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '1100px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-titles">
          <h1 className="text-headline-lg">Thêm Khóa học mới</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            {isAdmin ? "Tạo nội dung và thiết lập trạng thái khóa học." : "Tạo bản nháp khóa học. Sau khi hoàn chỉnh, gửi quản trị viên duyệt để xuất bản."}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/courses')} disabled={loading}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading || loadingCategories}>
            {loading ? 'Đang lưu...' : 'Lưu Khóa học'}
          </button>
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
          <div className="card p-6 mb-6">
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
          </div>

          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Trạng thái & Cài đặt</h3>
            <div className="status-options flex flex-col gap-4 mb-6">
              {isAdmin && <label className={`status-card ${status === 'PUBLISHED' ? 'active' : ''}`}>
                <input type="radio" name="status" checked={status === 'PUBLISHED'} onChange={() => setStatus('PUBLISHED')} className="custom-radio" disabled={loading} />
                <div className="status-info">
                  <span className="text-label-md">Công khai (Published)</span>
                  <span className="text-body-sm text-outline">Khóa học hiển thị với tất cả học viên.</span>
                </div>
              </label>}
              <label className={`status-card ${status === 'DRAFT' ? 'active' : ''}`}>
                <input type="radio" name="status" checked={status === 'DRAFT'} onChange={() => setStatus('DRAFT')} className="custom-radio" disabled={loading} />
                <div className="status-info">
                  <span className="text-label-md">Bản nháp (Draft)</span>
                  <span className="text-body-sm text-outline">Ẩn khóa học, chỉ admin/giảng viên mới thấy.</span>
                </div>
              </label>
              {!isAdmin && <p className="text-body-sm text-outline">Bạn chỉ có thể lưu bản nháp tại đây. Nút gửi duyệt xuất hiện trong trang chi tiết khóa học.</p>}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
