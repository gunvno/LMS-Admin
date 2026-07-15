"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ChevronDown, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import HasPermission from "@/components/HasPermission";
import CourseSelect from "@/components/forms/CourseSelect";
import ActionMenu from "@/components/ActionMenu";
import { useConfirmation } from "@/components/ConfirmationModal";
import Pagination from "@/components/Pagination";
import { Course, courseService } from "@/services/course.service";
import { Lesson, LessonStatus, lessonService } from "@/services/lesson.service";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION } from "@/lib/permissions";
import "./lessons.css";

function shouldIgnoreRowClick(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button, summary, details, input, select, textarea, label'));
}

function getShortId(id: string) {
  return id ? `#${id.slice(0, 8)}` : "-";
}

function statusClass(status: LessonStatus) {
  if (status === "ACTIVE") return "status-success-light";
  if (status === "DRAFT") return "status-pending-gray";
  return "status-error-light";
}

function statusLabel(status: LessonStatus) {
  const labels: Record<LessonStatus, string> = {
    DRAFT: "Draft",
    ACTIVE: "Published",
    INACTIVE: "Inactive",
    ARCHIVED: "Archived",
  };
  return labels[status] || status;
}

export default function LessonsPage() {
  const { confirm } = useConfirmation();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canViewCourses = hasPermission(PERMISSION.COURSE_VIEW);
  const canManageLessons = hasPermission(PERMISSION.LESSON_MANAGE);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [lessonPage, coursePage] = await Promise.all([
          lessonService.getLessons({ page: 0, size: 100, sort: "orderIndex,asc" }),
          canViewCourses ? courseService.getCourses({ page: 0, size: 100 }) : null,
        ]);
        setLessons(lessonPage.content || []);
        setTotalElements(lessonPage.totalElements || 0);
        setCourses(coursePage?.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh sách bài học.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [canViewCourses]);

  const courseNameById = useMemo(() => {
    return courses.reduce<Record<string, string>>((acc, course) => {
      acc[course.id] = course.name;
      return acc;
    }, {});
  }, [courses]);

  const filteredLessons = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchKeyword = !term || [
        lesson.title,
        lesson.code,
        lesson.content,
        courseNameById[lesson.courseId],
      ].some((value) => value?.toLowerCase().includes(term));
      const matchCourse = courseFilter === "ALL" || lesson.courseId === courseFilter;
      return matchKeyword && matchCourse;
    });
  }, [lessons, keyword, courseFilter, courseNameById]);

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, lessonId: string) => {
    if (shouldIgnoreRowClick(event.target)) return;
    router.push(`/lessons/${lessonId}`);
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!canManageLessons) return;

    const accepted = await confirm({
      title: "Xóa bài học?",
      description: `Bài học “${lesson.title}” cùng nội dung liên quan sẽ bị xóa và không thể khôi phục.`,
      confirmLabel: "Xóa bài học",
    });
    if (!accepted) return;

    try {
      setDeletingId(lesson.id);
      await lessonService.deleteLesson(lesson.id);
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
      setTotalElements((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được bài học.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Quản lý Bài học</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Quản lý nội dung bài học, video và tài nguyên đính kèm.</p>
        </div>
        <div className="header-actions">
          <HasPermission required={[PERMISSION.LESSON_MANAGE, PERMISSION.COURSE_VIEW]} mode="all">
            <Link href="/lessons/new" className="btn btn-primary action-btn">
              <Plus size={18} /> Tạo bài học mới
            </Link>
          </HasPermission>
        </div>
      </div>

      <div className="top-controls card p-2 mt-4">
        <div className="search-wrapper flex-1">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm bài học..."
            className="form-input search-input"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        {canViewCourses && <div className="dropdown-wrapper">
          <CourseSelect value={courseFilter} onChange={setCourseFilter} includeAllOption className="form-input dropdown-select text-body-sm" />
          <ChevronDown size={16} className="dropdown-icon" />
        </div>}
      </div>

      <div className="card table-card mt-4">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ID</th>
                <th style={{ width: '35%' }}>Bài học</th>
                <th style={{ width: '20%' }}>Khóa học</th>
                <th style={{ width: '15%' }}>Thời lượng</th>
                <th style={{ width: '10%' }}>Trạng thái</th>
                <th className="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-body-md text-on-surface-variant">Đang tải bài học...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="text-body-md text-on-surface-variant">{error}</td></tr>
              )}
              {!loading && !error && filteredLessons.length === 0 && (
                <tr><td colSpan={6} className="text-body-md text-on-surface-variant">Chưa có bài học phù hợp.</td></tr>
              )}
              {!loading && !error && filteredLessons.map((lesson) => (
                <tr className="clickable-row" key={lesson.id} onClick={(event) => handleRowClick(event, lesson.id)}>
                  <td className="text-body-md text-on-surface-variant">{getShortId(lesson.id)}</td>
                  <td>
                    <div className="cell-flex">
                      <div className="student-info">
                        <span className="text-label-md">{lesson.title}</span>
                        <span className="text-body-sm text-outline">{lesson.code || `Thứ tự ${lesson.orderIndex ?? "-"}`}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-body-md text-on-surface-variant">{courseNameById[lesson.courseId] || lesson.courseId}</td>
                  <td><span className="badge bg-surface-container-high text-on-surface">{lesson.durationMinutes ?? 0} phút</span></td>
                  <td><span className={`status-badge ${statusClass(lesson.status)}`}>{statusLabel(lesson.status)}</span></td>
                  <td className="actions-cell">
                    <ActionMenu
                      items={[
                        { label: "Xem chi tiết", href: `/lessons/${lesson.id}`, icon: <Eye size={16} /> },
                        ...(canManageLessons && canViewCourses ? [
                          { label: "Sửa", href: `/lessons/${lesson.id}/edit`, icon: <Edit size={16} /> },
                        ] : []),
                        ...(canManageLessons ? [
                          { label: deletingId === lesson.id ? "Đang xóa..." : "Xóa", icon: <Trash2 size={16} />, danger: true, disabled: deletingId === lesson.id, onClick: () => handleDelete(lesson) },
                        ] : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination summary={`Hiển thị ${filteredLessons.length} trong ${totalElements} bài học`} />
      </div>
    </div>
  );
}
