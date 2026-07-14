"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, CheckCircle2, Eye } from "lucide-react";
import ActionMenu from "@/components/ActionMenu";
import { useConfirmation } from "@/components/ConfirmationModal";
import { Course, courseService } from "@/services/course.service";
import { Enrollment, learningService } from "@/services/learning.service";
import { formatDate } from "@/lib/date";
import "./enrollment.css";

function shouldIgnoreRowClick(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button, summary, details, input, select, textarea, label'));
}

function statusClass(status: string) {
  if (status === "COMPLETED") return "status-success-light";
  if (status === "ACTIVE") return "status-pending-gray";
  return "status-error-light";
}

export default function EnrollmentPage() {
  const router = useRouter();
  const { confirm } = useConfirmation();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [enrollmentPage, coursePage] = await Promise.all([
          learningService.getMyCourses({ page: 0, size: 100 }),
          courseService.getCourses({ page: 0, size: 100 }),
        ]);
        setEnrollments(enrollmentPage.content || []);
        setCourses(coursePage.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh sách ghi danh.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const courseNameById = useMemo(() => {
    return courses.reduce<Record<string, string>>((acc, course) => {
      acc[course.id] = course.name;
      return acc;
    }, {});
  }, [courses]);

  const filteredEnrollments = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return enrollments.filter((enrollment) => !term || [
      enrollment.userId,
      enrollment.courseId,
      courseNameById[enrollment.courseId],
      enrollment.status,
    ].some((value) => value?.toLowerCase().includes(term)));
  }, [enrollments, keyword, courseNameById]);

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, enrollmentId: string) => {
    if (shouldIgnoreRowClick(event.target)) return;
    router.push(`/enrollment/${enrollmentId}`);
  };

  const handleComplete = async (enrollment: Enrollment) => {
    const accepted = await confirm({
      title: "Đánh dấu hoàn thành?",
      description: "Ghi danh này sẽ được chuyển sang trạng thái hoàn thành. Hãy kiểm tra tiến độ học trước khi tiếp tục.",
      confirmLabel: "Đánh dấu hoàn thành",
      tone: "warning",
    });
    if (!accepted) return;

    try {
      setCompletingId(enrollment.id);
      const updated = await learningService.completeCourse(enrollment.courseId);
      setEnrollments((prev) => prev.map((item) => item.id === enrollment.id ? { ...item, ...updated } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không hoàn thành được enrollment.");
    } finally {
      setCompletingId("");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Quản lý Ghi danh</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Hiển thị danh sách ghi danh của tài khoản hiện tại theo API learning-service.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary action-btn"><Download size={18} /> Export</button>
        </div>
      </div>

      <div className="top-controls card p-2">
        <div className="search-wrapper flex-1">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Tìm theo user, khóa học hoặc trạng thái..." className="form-input search-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </div>
        <div className="tabs">
          <button className="tab-pill active">Tất cả ({filteredEnrollments.length})</button>
          <button className="tab-pill">Active ({enrollments.filter((item) => item.status === "ACTIVE").length})</button>
          <button className="tab-pill">Completed ({enrollments.filter((item) => item.status === "COMPLETED").length})</button>
        </div>
      </div>

      {error && <div className="card p-4 mt-4 text-status-required">{error}</div>}

      <div className="card table-card mt-4">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>User ID</th>
                <th style={{ width: '30%' }}>Course</th>
                <th style={{ width: '15%' }}>Ngày đăng ký</th>
                <th style={{ width: '10%' }}>Tiến độ</th>
                <th style={{ width: '10%' }}>Status</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}>Đang tải ghi danh...</td></tr>}
              {!loading && filteredEnrollments.length === 0 && <tr><td colSpan={6}>Chưa có ghi danh phù hợp.</td></tr>}
              {!loading && filteredEnrollments.map((enrollment) => (
                <tr className="clickable-row" key={enrollment.id} onClick={(event) => handleRowClick(event, enrollment.id)}>
                  <td className="text-body-md text-on-surface-variant">{enrollment.userId}</td>
                  <td>
                    <div className="student-info">
                      <span className="text-body-md">{courseNameById[enrollment.courseId] || enrollment.courseId}</span>
                      <span className="text-body-sm text-outline">{enrollment.courseId}</span>
                    </div>
                  </td>
                  <td className="text-body-md text-on-surface-variant">{formatDate(enrollment.enrolledAt)}</td>
                  <td className="text-label-md text-primary">{enrollment.progressPercent ?? 0}%</td>
                  <td><span className={`status-badge ${statusClass(enrollment.status)}`}>{enrollment.status}</span></td>
                  <td className="actions-cell">
                    <ActionMenu
                      items={[
                        { label: "Hoàn thành", icon: <CheckCircle2 size={16} />, disabled: enrollment.status === "COMPLETED" || completingId === enrollment.id, onClick: () => handleComplete(enrollment) },
                        { label: "Xem chi tiết", href: `/enrollment/${enrollment.id}`, icon: <Eye size={16} /> },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="text-body-sm text-on-surface-variant">Hiển thị {filteredEnrollments.length} ghi danh. Backend hiện chưa có API admin list toàn hệ thống.</span>
        </div>
      </div>
    </div>
  );
}
