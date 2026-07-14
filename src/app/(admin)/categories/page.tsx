
"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, CheckCircle2, LayoutGrid, Monitor, Palette, Megaphone, Wallet, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HasPermission from "@/components/HasPermission";
import ActionMenu from "@/components/ActionMenu";
import { useConfirmation } from "@/components/ConfirmationModal";
import Pagination from "@/components/Pagination";
import { CourseCategory, courseService } from "@/services/course.service";
import "./categories.css";

const categoryIcons = [Monitor, Palette, Megaphone, Wallet];
const iconClasses = ["bg-primary-fixed", "bg-secondary-fixed", "bg-primary-fixed-dim", "bg-primary-fixed"];

function shouldIgnoreRowClick(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button, summary, details, input, select, textarea, label'));
}

function statusClass(status: string) {
  return status === 'ACTIVE' ? 'status-success-light' : 'status-pending-gray';
}

export default function CategoriesPage() {
  const router = useRouter();
  const { confirm } = useConfirmation();
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");
        const page = await courseService.getCategories({ page: 0, size: 50 });
        setCategories(page.content || []);
        setTotalElements(page.totalElements || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh mục.");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, categoryId: string) => {
    if (shouldIgnoreRowClick(event.target)) return;
    router.push(`/categories/${categoryId}`);
  };

  const handleDelete = async (category: CourseCategory) => {
    const accepted = await confirm({
      title: "Xóa danh mục?",
      description: `Danh mục “${category.name}” sẽ bị xóa và không thể khôi phục.`,
      confirmLabel: "Xóa danh mục",
    });
    if (!accepted) return;

    try {
      setDeletingId(category.id);
      await courseService.deleteCategory(category.id);
      setCategories(prev => prev.filter(item => item.id !== category.id));
      setTotalElements(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được danh mục.");
    } finally {
      setDeletingId("");
    }
  };

  const filteredCategories = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter(item =>
      [item.name, item.code, item.description].some(value => value?.toLowerCase().includes(term))
    );
  }, [categories, keyword]);

  const activeCount = categories.filter(item => item.status === 'ACTIVE').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Quản lý Danh mục</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Xem, thêm, sửa, xóa các danh mục khóa học trên hệ thống.
          </p>
        </div>
        <div className="header-actions">
          <HasPermission required="CATEGORY_MANAGE">
            <Link href="/categories/new" className="btn btn-primary action-btn">
              <Plus size={18} /> Thêm danh mục
            </Link>
          </HasPermission>
        </div>
      </div>

      <div className="top-controls">
        <div className="stats-row">
          <div className="card stat-card">
            <div className="stat-info">
              <span className="text-label-sm text-outline uppercase tracking-wide">TỔNG DANH MỤC</span>
              <span className="text-headline-lg mt-1">{loading ? '...' : totalElements}</span>
            </div>
            <div className="stat-icon bg-primary-fixed">
              <LayoutGrid size={24} className="text-primary" />
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-info">
              <span className="text-label-sm text-outline uppercase tracking-wide">ĐANG HOẠT ĐỘNG</span>
              <span className="text-headline-lg mt-1">{loading ? '...' : activeCount}</span>
            </div>
            <div className="stat-icon bg-success-container">
              <CheckCircle2 size={24} className="text-success" />
            </div>
          </div>
        </div>
        
        <div className="search-container card">
          <div className="input-wrapper search-wrapper">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm danh mục..." 
              className="form-input search-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Tên danh mục</th>
                <th style={{ width: '15%' }}>Mã</th>
                <th style={{ width: '35%' }}>Mô tả</th>
                <th style={{ width: '10%' }}>Trạng thái</th>
                <th className="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }).map((_, index) => (
                <tr key={`loading-${index}`}>
                  <td colSpan={5} className="text-body-md text-on-surface-variant">Đang tải danh mục...</td>
                </tr>
              ))}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="text-body-md text-on-surface-variant">{error}</td>
                </tr>
              )}

              {!loading && !error && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-body-md text-on-surface-variant">Chưa có danh mục phù hợp.</td>
                </tr>
              )}

              {!loading && !error && filteredCategories.map((category, index) => {
                const Icon = categoryIcons[index % categoryIcons.length];
                return (
                  <tr key={category.id} className="clickable-row" onClick={(event) => handleRowClick(event, category.id)}>
                    <td>
                      <div className="cell-flex">
                        <div className={`category-icon-wrapper ${iconClasses[index % iconClasses.length]}`}>
                          <Icon size={20} className="text-primary" />
                        </div>
                        <div className="cell-main">
                          <span className="cell-title">{category.name}</span>
                          <span className="cell-subtitle">{category.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-body-md text-on-surface-variant">{category.code}</td>
                    <td className="text-body-sm text-on-surface-variant">{category.description || '-'}</td>
                    <td><span className={`status-badge ${statusClass(category.status)}`}>{category.status}</span></td>
                    <td className="actions-cell">
                      <HasPermission required="CATEGORY_MANAGE">
                        <ActionMenu
                          items={[
                            { label: 'Xem chi tiết', href: `/categories/${category.id}`, icon: <Edit size={16} /> },
                            { label: 'Sửa', href: `/categories/${category.id}/edit`, icon: <Edit size={16} /> },
                            { label: deletingId === category.id ? 'Đang xóa...' : 'Xóa', icon: <Trash2 size={16} />, danger: true, disabled: deletingId === category.id, onClick: () => handleDelete(category) },
                          ]}
                        />
                      </HasPermission>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination summary={<>Hiển thị <strong>{filteredCategories.length}</strong> trong số <strong>{totalElements}</strong> danh mục</>} />
      </div>
    </div>
  );
}
