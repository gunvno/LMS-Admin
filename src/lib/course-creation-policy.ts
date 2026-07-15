export type CourseCreationAction = "server-draft" | "submit-review" | "publish";
export type ServerCourseDraftStatus = "INSTRUCTOR_DRAFT" | "DRAFT";

export function getServerCourseDraftStatus(canReviewCourses: boolean): ServerCourseDraftStatus {
  return canReviewCourses ? "DRAFT" : "INSTRUCTOR_DRAFT";
}

export function canUseCourseCreationAction(
  action: CourseCreationAction,
  canManageCourses: boolean,
  canSubmitReview: boolean,
  canReviewCourses: boolean,
): boolean {
  if (!canManageCourses) return false;
  if (action === "submit-review") return canSubmitReview;
  if (action === "publish") return canReviewCourses;
  return true;
}
