"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";
import HasPermission from "@/components/HasPermission";
import { CourseCategoryStatus, courseService } from "@/services/course.service";

export default function NewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseCategoryStatus>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      await courseService.createCategory({ name, code, description, status });
      router.replace('/categories');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được danh mục.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-titles flex-center gap-4">
          <Link href="/categories" className="icon-btn text-outline">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-headline-lg">Thêm Danh Mục Mới</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Tạo danh mục mới để phân loại khóa học.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-8" style={{ marginBottom: 16, color: 'var(--on-error-container)', backgroundColor: 'var(--error-container)' }}>
          {error}
        </div>
      )}

      <div className="card p-8">
        <div className="form-group mb-6">
          <label className="text-label-md">
            Tên danh mục <span className="text-status-required">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Nhập tên danh mục..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group mb-6">
          <label className="text-label-md">
            Mã danh mục <span className="text-status-required">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="VD: BACKEND"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group mb-6">
          <label className="text-label-md">Mô tả ngắn</label>
          <textarea
            className="form-input"
            placeholder="Nhập mô tả..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group mb-6">
          <label className="text-label-md">Trạng thái</label>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as CourseCategoryStatus)} disabled={loading}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div className="form-group mb-8">
          <label className="text-label-md mb-2 block">Icon / Thumbnail</label>
          <div className="upload-area" style={{ border: '2px dashed var(--outline-variant)', borderRadius: 'var(--rounded-lg)', padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)' }}>
            <UploadCloud size={32} className="text-primary mx-auto mb-3" />
            <p className="text-body-md">Icon danh mục sẽ bổ sung sau.</p>
          </div>
        </div>

        <div className="form-footer border-t pt-6 flex justify-end gap-4">
          <Link href="/categories" className="btn btn-ghost">Hủy</Link>
          <HasPermission required={["CATEGORY_MANAGE", "COURSE_REVIEW"]} mode="all">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu Danh Mục'}</button>
          </HasPermission>
        </div>
      </div>
    </form>
  );
}
