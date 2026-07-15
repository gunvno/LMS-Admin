export const PERMISSION = {
  USER_PROFILE_VIEW: "USER_PROFILE_VIEW",
  COURSE_VIEW: "COURSE_VIEW",
  COURSE_MANAGE: "COURSE_MANAGE",
  COURSE_SUBMIT_REVIEW: "COURSE_SUBMIT_REVIEW",
  COURSE_REVIEW: "COURSE_REVIEW",
  CATEGORY_VIEW: "CATEGORY_VIEW",
  CATEGORY_MANAGE: "CATEGORY_MANAGE",
  LESSON_VIEW: "LESSON_VIEW",
  LESSON_MANAGE: "LESSON_MANAGE",
  RESOURCE_VIEW: "RESOURCE_VIEW",
  RESOURCE_MANAGE: "RESOURCE_MANAGE",
  IMAGE_VIEW: "IMAGE_VIEW",
  IMAGE_MANAGE: "IMAGE_MANAGE",
  ENROLLMENT_VIEW: "ENROLLMENT_VIEW",
  ENROLLMENT_MANAGE: "ENROLLMENT_MANAGE",
  LEARNING_PROGRESS_VIEW: "LEARNING_PROGRESS_VIEW",
  LEARNING_PROGRESS_UPDATE: "LEARNING_PROGRESS_UPDATE",
  QUIZ_VIEW: "QUIZ_VIEW",
  QUIZ_MANAGE: "QUIZ_MANAGE",
  QUESTION_MANAGE: "QUESTION_MANAGE",
  ANSWER_MANAGE: "ANSWER_MANAGE",
  CERTIFICATE_VIEW: "CERTIFICATE_VIEW",
  CERTIFICATE_MANAGE: "CERTIFICATE_MANAGE",
  CERTIFICATE_VERIFY: "CERTIFICATE_VERIFY",
  PAYMENT_VIEW: "PAYMENT_VIEW",
  PAYMENT_MANAGE: "PAYMENT_MANAGE",
  NOTICE_VIEW: "NOTICE_VIEW",
  NOTICE_SEND: "NOTICE_SEND",
  NOTICE_BROADCAST: "NOTICE_BROADCAST",
  DEVICE_MANAGE: "DEVICE_MANAGE",
  PERMISSION_VIEW: "PERMISSION_VIEW",
  PERMISSION_MANAGE: "PERMISSION_MANAGE",
  STAFF_VIEW: "STAFF_VIEW",
  STAFF_CREATE: "STAFF_CREATE",
  STAFF_UPDATE: "STAFF_UPDATE",
  STAFF_STATUS_UPDATE: "STAFF_STATUS_UPDATE",
  STAFF_PASSWORD_RESET: "STAFF_PASSWORD_RESET",
  STAFF_ACTIVITY_VIEW: "STAFF_ACTIVITY_VIEW",
} as const;

export type PermissionCode = (typeof PERMISSION)[keyof typeof PERMISSION];
export type PermissionMode = "any" | "all";

export const REQUIRED_ADMIN_PORTAL_PERMISSIONS = [PERMISSION.USER_PROFILE_VIEW] as const;

export interface PermissionRequirement {
  anyOf?: readonly PermissionCode[];
  allOf?: readonly PermissionCode[];
}

export interface RoutePermissionRule extends PermissionRequirement {
  matches: (pathname: string) => boolean;
  title: string;
}

export function normalizePermission(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizePermissions(values: readonly string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(values.filter((value): value is string => typeof value === "string")
      .map(normalizePermission)
      .filter(Boolean))
  );
}

export function isRequiredAdminPortalPermission(permission: string): boolean {
  const normalized = normalizePermission(permission);
  return REQUIRED_ADMIN_PORTAL_PERMISSIONS.some((required) => required === normalized);
}

export function preserveRequiredAdminPortalPermissions(permissionCodes: readonly string[]): string[] {
  return normalizePermissions([...permissionCodes, ...REQUIRED_ADMIN_PORTAL_PERMISSIONS]);
}

export function hasRequiredPermission(
  grantedPermissions: readonly string[],
  required: string | readonly string[],
  mode: PermissionMode = "any"
): boolean {
  const granted = new Set(normalizePermissions(grantedPermissions));
  const expected = (Array.isArray(required) ? required : [required])
    .map(normalizePermission)
    .filter(Boolean);

  if (expected.length === 0) return true;
  return mode === "all"
    ? expected.every((permission) => granted.has(permission))
    : expected.some((permission) => granted.has(permission));
}

export function satisfiesRequirement(
  grantedPermissions: readonly string[],
  requirement?: PermissionRequirement
): boolean {
  if (!requirement) return true;
  if (requirement.allOf && !hasRequiredPermission(grantedPermissions, requirement.allOf, "all")) {
    return false;
  }
  if (requirement.anyOf && !hasRequiredPermission(grantedPermissions, requirement.anyOf, "any")) {
    return false;
  }
  return true;
}

const exact = (path: string) => (pathname: string) => pathname === path;
const prefix = (path: string) => (pathname: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

// Keep the most specific routes first.
export const ROUTE_PERMISSION_RULES: readonly RoutePermissionRule[] = [
  { matches: exact("/dashboard"), title: "tổng quan" },
  {
    matches: exact("/categories/new"),
    allOf: [PERMISSION.CATEGORY_MANAGE, PERMISSION.COURSE_REVIEW],
    title: "tạo danh mục",
  },
  {
    matches: (pathname) => /^\/categories\/[^/]+\/edit$/.test(pathname),
    allOf: [PERMISSION.CATEGORY_VIEW, PERMISSION.CATEGORY_MANAGE, PERMISSION.COURSE_REVIEW],
    title: "chỉnh sửa danh mục",
  },
  { matches: prefix("/categories"), allOf: [PERMISSION.CATEGORY_VIEW], title: "danh mục" },
  {
    matches: exact("/courses/new"),
    allOf: [PERMISSION.COURSE_MANAGE],
    title: "tạo khóa học",
  },
  {
    matches: (pathname) => /^\/courses\/[^/]+\/edit$/.test(pathname),
    allOf: [PERMISSION.COURSE_VIEW, PERMISSION.COURSE_MANAGE],
    title: "chỉnh sửa khóa học",
  },
  { matches: prefix("/courses"), allOf: [PERMISSION.COURSE_VIEW], title: "khóa học" },
  {
    matches: exact("/lessons/new"),
    allOf: [PERMISSION.LESSON_MANAGE, PERMISSION.COURSE_VIEW],
    title: "tạo bài học",
  },
  {
    matches: (pathname) => /^\/lessons\/[^/]+\/edit$/.test(pathname),
    allOf: [PERMISSION.LESSON_VIEW, PERMISSION.LESSON_MANAGE, PERMISSION.COURSE_VIEW],
    title: "chỉnh sửa bài học",
  },
  { matches: prefix("/lessons"), allOf: [PERMISSION.LESSON_VIEW], title: "bài học" },
  {
    matches: (pathname) => /^\/quiz\/[^/]+\/questions\/new$/.test(pathname),
    allOf: [PERMISSION.QUESTION_MANAGE, PERMISSION.ANSWER_MANAGE],
    title: "tạo câu hỏi",
  },
  {
    matches: (pathname) => /^\/quiz\/[^/]+\/questions\/[^/]+\/edit$/.test(pathname),
    allOf: [PERMISSION.QUIZ_VIEW, PERMISSION.QUESTION_MANAGE, PERMISSION.ANSWER_MANAGE],
    title: "chỉnh sửa câu hỏi",
  },
  {
    matches: exact("/quiz/new"),
    allOf: [PERMISSION.QUIZ_MANAGE, PERMISSION.COURSE_VIEW, PERMISSION.LESSON_VIEW],
    title: "tạo bài kiểm tra",
  },
  { matches: prefix("/quiz"), allOf: [PERMISSION.QUIZ_VIEW], title: "bài kiểm tra" },
  { matches: prefix("/enrollment"), allOf: [PERMISSION.ENROLLMENT_VIEW], title: "ghi danh" },
  {
    matches: (pathname) => /^\/certificates\/[^/]+$/.test(pathname),
    allOf: [PERMISSION.CERTIFICATE_VERIFY],
    title: "xác minh chứng chỉ",
  },
  {
    matches: prefix("/certificates"),
    anyOf: [PERMISSION.CERTIFICATE_MANAGE, PERMISSION.CERTIFICATE_VERIFY],
    title: "chứng chỉ",
  },
  { matches: prefix("/payments"), allOf: [PERMISSION.PAYMENT_MANAGE], title: "doanh thu" },
  {
    matches: prefix("/notices"),
    anyOf: [PERMISSION.NOTICE_VIEW, PERMISSION.NOTICE_BROADCAST],
    title: "thông báo",
  },
  { matches: exact("/staff/new"), allOf: [PERMISSION.STAFF_CREATE], title: "tạo nhân sự" },
  { matches: prefix("/staff"), allOf: [PERMISSION.STAFF_VIEW], title: "nhân sự" },
  { matches: prefix("/messages"), title: "tin nhắn hỗ trợ" },
];

export function getRoutePermission(pathname: string): RoutePermissionRule | undefined {
  return ROUTE_PERMISSION_RULES.find((rule) => rule.matches(pathname));
}

export function canAccessAdminRoute(
  grantedPermissions: readonly string[],
  pathname: string
): boolean {
  const requirement = getRoutePermission(pathname);
  return Boolean(requirement && satisfiesRequirement(grantedPermissions, requirement));
}
