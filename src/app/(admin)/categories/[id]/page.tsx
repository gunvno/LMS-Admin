"use client";

import "../../detail.css";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, FolderOpen, Hash, ToggleLeft } from "lucide-react";
import HasPermission from "@/components/HasPermission";
import { CourseCategory, courseService } from "@/services/course.service";

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [category, setCategory] = useState<CourseCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await courseService.getCategory(params.id);
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chi tiết danh mục.");
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [params.id]);

  return (
    <div className="page-container detail-page">
      <div className="detail-toolbar">
        <Link href="/categories" className="btn btn-ghost"><ArrowLeft size={18} /> Quay lại</Link>
        {category && (
          <HasPermission required="CATEGORY_MANAGE">
            <Link href={`/categories/${category.id}/edit`} className="btn btn-primary"><Edit size={18} /> Sửa danh mục</Link>
          </HasPermission>
        )}
      </div>

      {error && <div className="card p-6 mb-6" style={{ color: "var(--on-error-container)", backgroundColor: "var(--error-container)" }}>{error}</div>}

      {loading ? (
        <div className="card p-6">Đang tải...</div>
      ) : category ? (
        <>
          <section className="detail-hero-card">
            <div className="detail-avatar"><FolderOpen size={34} /></div>
            <div className="detail-hero-copy">
              <div className="detail-kicker">Danh mục khóa học</div>
              <h1>{category.name}</h1>
              <p>{category.description || "Chưa có mô tả cho danh mục này."}</p>
              <div className="detail-chip-row">
                <span className={`status-badge ${category.status === "ACTIVE" ? "status-success-light" : "status-pending-gray"}`}>{category.status}</span>
                <span className="detail-chip">{category.code}</span>
              </div>
            </div>
          </section>

          <div className="detail-summary-grid two">
            <div className="metric-card"><Hash size={18} /><span>Mã danh mục</span><strong>{category.code}</strong></div>
            <div className="metric-card"><ToggleLeft size={18} /><span>Trạng thái</span><strong>{category.status}</strong></div>
          </div>

          <section className="detail-panel">
            <div className="section-heading">
              <h2>Thông tin danh mục</h2>
              <p>Dữ liệu dùng để nhóm và lọc khóa học trong hệ thống.</p>
            </div>
            <div className="detail-list">
              <div className="detail-list-row"><span>ID</span><strong>{category.id}</strong></div>
              <div className="detail-list-row"><span>Tên danh mục</span><strong>{category.name}</strong></div>
              <div className="detail-list-row"><span>Mã danh mục</span><strong>{category.code}</strong></div>
              <div className="detail-list-row"><span>Mô tả</span><strong>{category.description || "Chưa có mô tả."}</strong></div>
            </div>
          </section>
        </>
      ) : (
        <div className="card p-6">Không tìm thấy danh mục.</div>
      )}
    </div>
  );
}
