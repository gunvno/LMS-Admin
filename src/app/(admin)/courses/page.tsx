
"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HasPermission from "@/components/HasPermission";
import ActionMenu from "@/components/ActionMenu";
import { BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getCookie } from "@/lib/api-client";
import { Course, CourseCategory, CourseStatus, courseService } from "@/services/course.service";
import "./courses.css";

function shouldIgnoreRowClick(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button, summary, details, input, select, textarea, label'));
}

function CourseThumbnail({ courseId, name }: { courseId: string; name: string; index: number }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let objectUrl = "";
    const loadImage = async () => {
      const token = getCookie('auth_token');
      if (!token || !courseId) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';
        const response = await fetch(`${baseUrl}/course/api/v1/courses/${courseId}/images/primary/view`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': 'vi',
          },
        });
        if (!response.ok) return;
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        setSrc("");
      }
    };

    loadImage();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [courseId]);

  if (!src) {
    return <div className="course-thumbnail thumbnail-fallback">{name?.slice(0, 1).toUpperCase() || "C"}</div>;
  }

  return <img src={src} alt={name} className="course-thumbnail" />;
}

function statusClass(status: CourseStatus) {
  if (status === 'PUBLISHED') return 'status-success-light';
  if (status === 'DRAFT' || status === 'PENDING_REVIEW') return 'status-pending-gray';
  return 'status-error-light';
}

function formatStatus(status: CourseStatus) {
  const labels: Record<CourseStatus, string> = {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending Review',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
    ARCHIVED: 'Archived',
  };
  return labels[status] || status;
}

function getShortId(id: string) {
  if (!id) return '-';
  return `#${id.slice(0, 8)}`;
}

function formatPrice(value?: number) {
  if (!value) return "Miễn phí";
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export default function CoursesPage() {
  const router = useRouter();
  const { hasPermission, isAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<"ALL" | CourseStatus>("ALL");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [coursePage, categoryPage] = await Promise.all([
          courseService.getCourses({ page: 0, size: 50 }),
          courseService.getCategories({ page: 0, size: 100 }),
        ]);
        setCourses(coursePage.content || []);
        setTotalElements(coursePage.totalElements || 0);
        setCategories(categoryPage.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh sách khóa học.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const filteredCourses = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return courses.filter(course => {
      const matchKeyword = !term || [
        course.name,
        course.code,
        course.description,
        categoryNameById[course.categoryId],
      ].some(value => value?.toLowerCase().includes(term));
      const matchStatus = status === 'ALL' || course.status === status;
      return matchKeyword && matchStatus;
    });
  }, [courses, keyword, status, categoryNameById]);

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, courseId: string) => {
    if (shouldIgnoreRowClick(event.target)) return;
    router.push(`/courses/${courseId}`);
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Xóa khóa học "${course.name}"?`)) return;

    try {
      setDeletingId(course.id);
      await courseService.deleteCourse(course.id);
      setCourses(prev => prev.filter(item => item.id !== course.id));
      setTotalElements(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được khóa học.");
    } finally {
      setDeletingId("");
    }
  };

  const handleApprove = async (course: Course) => {
    if (!window.confirm(`Duyệt và xuất bản khóa học "${course.name}"?`)) return;

    try {
      setApprovingId(course.id);
      setError("");
      const updatedCourse = await courseService.approveCourse(course.id);
      setCourses(prev => prev.map(item => item.id === course.id ? updatedCourse : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không duyệt được khóa học.");
    } finally {
      setApprovingId("");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Quản lý Khóa học</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Quản lý nội dung, trạng thái và ảnh đại diện khóa học.</p>
        </div>
        <div className="header-actions">
          <HasPermission required="COURSE_MANAGE">
            <Link href="/courses/new" className="btn btn-primary action-btn">
              <Plus size={18} /> Tạo khóa học mới
            </Link>
          </HasPermission>
        </div>
      </div>

      <div className="top-controls card p-2">
        <div className="search-wrapper flex-1">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm khóa học..." 
            className="form-input search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="dropdown-wrapper">
          <select
            className="form-input dropdown-select text-body-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as "ALL" | CourseStatus)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>
      </div>

      <div className="card table-card mt-4">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ID</th>
                <th style={{ width: '35%' }}>Khóa học</th>
                <th style={{ width: '15%' }}>Danh mục</th>
                <th style={{ width: '10%' }}>Cấp độ</th>
                <th style={{ width: '10%' }}>Giá</th>
                <th style={{ width: '12%' }}>Trạng thái</th>
                <th className="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 3 }).map((_, index) => (
                <tr key={`loading-${index}`}>
                  <td colSpan={7} className="text-body-md text-on-surface-variant">Đang tải khóa học...</td>
                </tr>
              ))}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="text-body-md text-on-surface-variant">{error}</td>
                </tr>
              )}

              {!loading && !error && filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-body-md text-on-surface-variant">Chưa có khóa học phù hợp.</td>
                </tr>
              )}

              {!loading && !error && filteredCourses.map((course, index) => (
                <tr key={course.id} className="clickable-row" onClick={(event) => handleRowClick(event, course.id)}>
                  <td className="text-body-md text-on-surface-variant">{getShortId(course.id)}</td>
                  <td>
                    <div className="cell-flex">
                      <CourseThumbnail courseId={course.id} name={course.name} index={index} />
                      <div className="cell-main">
                        <span className="cell-title">{course.name}</span>
                        <span className="cell-subtitle">{course.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-body-md text-on-surface-variant">{categoryNameById[course.categoryId] || '-'}</td>
                  <td className="text-body-md text-on-surface-variant">{course.level || '-'}</td>
                  <td className="text-body-md">{formatPrice(course.price)}</td>
                  <td>
                    <span className={`status-badge ${statusClass(course.status)}`}>{formatStatus(course.status)}</span>
                  </td>
                  <td className="actions-cell">
                    <HasPermission required={["COURSE_MANAGE", "COURSE_REVIEW"]}>
                      <ActionMenu
                        items={[
                          { label: 'Xem chi tiết', href: `/courses/${course.id}`, icon: <Eye size={16} /> },
                          ...(isAdmin && course.status === 'PENDING_REVIEW' && hasPermission('COURSE_REVIEW') ? [{
                            label: approvingId === course.id ? 'Đang duyệt...' : 'Duyệt và xuất bản',
                            icon: <BadgeCheck size={16} />,
                            disabled: approvingId === course.id,
                            onClick: () => void handleApprove(course),
                          }] : []),
                          ...(hasPermission('COURSE_MANAGE') ? [
                            { label: 'Sửa', href: `/courses/${course.id}/edit`, icon: <Edit size={16} /> },
                            { label: deletingId === course.id ? 'Đang xóa...' : 'Xóa', icon: <Trash2 size={16} />, danger: true, disabled: deletingId === course.id, onClick: () => void handleDelete(course) },
                          ] : []),
                        ]}
                      />
                    </HasPermission>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="text-body-sm text-on-surface-variant">
            Showing {filteredCourses.length} of {totalElements} entries
          </span>
          <div className="pagination">
            <button className="page-btn" disabled><ChevronLeft size={16} /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn" disabled><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
