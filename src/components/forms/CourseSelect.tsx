"use client";

import { useEffect, useMemo, useState } from "react";
import { Course, CourseStatus, courseService } from "@/services/course.service";

type CourseSelectProps = {
  value: string;
  onChange: (courseId: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  includeAllOption?: boolean;
  allLabel?: string;
  placeholder?: string;
  status?: "ALL" | CourseStatus;
};

export default function CourseSelect({
  value,
  onChange,
  className = "form-input",
  disabled = false,
  required = false,
  includeAllOption = false,
  allLabel = "Tất cả khóa học",
  placeholder = "Chọn khóa học...",
  status = "ALL",
}: CourseSelectProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError("");
        const page = await courseService.getCourses({ page: 0, size: 100 });
        setCourses(page.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được khóa học.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    if (status === "ALL") return courses;
    return courses.filter((course) => course.status === status);
  }, [courses, status]);

  return (
    <select
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || loading}
      required={required}
      title={error || undefined}
    >
      {includeAllOption && <option value="ALL">{allLabel}</option>}
      {!includeAllOption && <option value="">{loading ? "Đang tải khóa học..." : placeholder}</option>}
      {error && <option value="" disabled>{error}</option>}
      {filteredCourses.map((course) => (
        <option key={course.id} value={course.id}>
          {course.name} {course.code ? `- ${course.code}` : ""}
        </option>
      ))}
    </select>
  );
}
