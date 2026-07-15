import type { CourseStatus } from "@/services/course.service";

export const COURSE_STATUS_OPTIONS: readonly CourseStatus[] = [
  "INSTRUCTOR_DRAFT",
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
];

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  INSTRUCTOR_DRAFT: "Bản nháp giảng viên",
  DRAFT: "Bản nháp quản trị",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Bị từ chối",
  ARCHIVED: "Đã lưu trữ",
};

export const COURSE_STATUS_DESCRIPTIONS: Record<CourseStatus, string> = {
  INSTRUCTOR_DRAFT: "Bản nháp riêng của giảng viên sở hữu. Khóa học chưa vào hàng chờ duyệt và quản trị viên chưa thấy trong danh sách duyệt.",
  DRAFT: "Bản nháp do người có quyền duyệt quản lý và chưa vào hàng chờ duyệt.",
  PENDING_REVIEW: "Khóa học đã được gửi duyệt; người có quyền duyệt có thể kiểm tra và xuất bản.",
  PUBLISHED: "Khóa học đã được duyệt, xuất bản và có thể hiển thị cho học viên.",
  REJECTED: "Khóa học đã bị từ chối. Giảng viên có thể chỉnh sửa rồi gửi duyệt lại.",
  ARCHIVED: "Khóa học đã được lưu trữ và không còn hoạt động.",
};

export function isCourseStatus(value: string | null | undefined): value is CourseStatus {
  return Boolean(value && COURSE_STATUS_OPTIONS.includes(value as CourseStatus));
}

export function getCourseStatusLabel(status: CourseStatus): string {
  return COURSE_STATUS_LABELS[status] || status;
}

export function getCourseStatusDescription(status: CourseStatus): string {
  return COURSE_STATUS_DESCRIPTIONS[status] || status;
}

export function getCourseStatusClass(status: CourseStatus): string {
  if (status === "PUBLISHED") return "status-success-light";
  if (status === "INSTRUCTOR_DRAFT") return "status-instructor-draft";
  if (status === "DRAFT" || status === "PENDING_REVIEW") return "status-pending-gray";
  return "status-error-light";
}

export function canSubmitCourseForReview(status: CourseStatus): boolean {
  return status === "INSTRUCTOR_DRAFT" || status === "DRAFT" || status === "REJECTED";
}
