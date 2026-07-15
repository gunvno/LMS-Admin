
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import HasPermission from "@/components/HasPermission";
import { CourseCategoryStatus, courseService } from "@/services/course.service";

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseCategoryStatus>("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        const category = await courseService.getCategory(params.id);
        setName(category.name || "");
        setCode(category.code || "");
        setDescription(category.description || "");
        setStatus(category.status || "ACTIVE");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh mục.");
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [params.id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      setSaving(true);
      await courseService.updateCategory(params.id, { name, code, description, status });
      router.push('/categories');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được danh mục.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '780px' }}>
      <div className="page-header">
        <div className="header-titles flex-center gap-4">
          <Link href="/categories" className="icon-btn text-outline"><ArrowLeft size={22} /></Link>
          <div>
            <h1 className="text-headline-lg">Sửa danh mục</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Cập nhật thông tin danh mục khóa học.</p>
          </div>
        </div>
      </div>

      {error && <div className="card p-6 mb-6" style={{ color: 'var(--on-error-container)', backgroundColor: 'var(--error-container)' }}>{error}</div>}

      <div className="card p-6">
        {loading ? (
          <p className="text-body-md text-on-surface-variant">Đang tải...</p>
        ) : (
          <>
            <div className="form-group mb-6">
              <label className="text-label-md">Tên danh mục *</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
            </div>
            <div className="form-group mb-6">
              <label className="text-label-md">Mã danh mục *</label>
              <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} required disabled={saving} />
            </div>
            <div className="form-group mb-6">
              <label className="text-label-md">Mô tả</label>
              <textarea className="form-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
            </div>
            <div className="form-group mb-6">
              <label className="text-label-md">Trạng thái</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as CourseCategoryStatus)} disabled={saving}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="form-footer border-t pt-6 flex justify-end gap-4">
              <Link href="/categories" className="btn btn-ghost">Hủy</Link>
              <HasPermission required={["CATEGORY_MANAGE", "COURSE_REVIEW"]} mode="all">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </HasPermission>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
