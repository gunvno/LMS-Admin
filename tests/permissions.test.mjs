import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const permissionSource = await readFile(
  new URL("../src/lib/permissions.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(permissionSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  PERMISSION,
  canAccessAdminRoute,
  getRoutePermission,
  hasRequiredPermission,
  isRequiredAdminPortalPermission,
  normalizePermissions,
  preserveRequiredAdminPortalPermissions,
  satisfiesRequirement,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("normalizes and de-duplicates effective permissions", () => {
  assert.deepEqual(
    normalizePermissions([" course_view ", "COURSE_VIEW", "payment_manage"]),
    ["COURSE_VIEW", "PAYMENT_MANAGE"],
  );
});

test("keeps the permission required to bootstrap the admin portal", () => {
  assert.equal(isRequiredAdminPortalPermission(" user_profile_view "), true);
  assert.deepEqual(
    preserveRequiredAdminPortalPermissions(["COURSE_VIEW"]),
    ["COURSE_VIEW", "USER_PROFILE_VIEW"],
  );
});

test("supports any permission for independent actions", () => {
  assert.equal(
    hasRequiredPermission(["COURSE_REVIEW"], ["COURSE_MANAGE", "COURSE_REVIEW"]),
    true,
  );
  assert.equal(
    hasRequiredPermission(["COURSE_VIEW"], ["COURSE_MANAGE", "COURSE_REVIEW"]),
    false,
  );
});

test("requires every permission for combined backend policies", () => {
  assert.equal(
    hasRequiredPermission(
      ["CATEGORY_VIEW", "CATEGORY_MANAGE", "COURSE_REVIEW"],
      ["CATEGORY_VIEW", "CATEGORY_MANAGE", "COURSE_REVIEW"],
      "all",
    ),
    true,
  );
  assert.equal(
    hasRequiredPermission(
      ["CATEGORY_VIEW", "CATEGORY_MANAGE"],
      ["CATEGORY_VIEW", "CATEGORY_MANAGE", "COURSE_REVIEW"],
      "all",
    ),
    false,
  );
});

test("matches the most specific route rule before a parent route", () => {
  const createCategory = getRoutePermission("/categories/new");
  const categoryList = getRoutePermission("/categories");

  assert.equal(createCategory?.title, "tạo danh mục");
  assert.equal(
    satisfiesRequirement(
      ["CATEGORY_MANAGE"],
      createCategory,
    ),
    false,
  );
  assert.equal(
    satisfiesRequirement(["CATEGORY_MANAGE", "COURSE_REVIEW"], createCategory),
    true,
  );
  assert.equal(satisfiesRequirement(["CATEGORY_VIEW"], categoryList), true);
});

test("blocks direct payment URLs without PAYMENT_MANAGE", () => {
  const payments = getRoutePermission("/payments");

  assert.equal(satisfiesRequirement(["PAYMENT_VIEW"], payments), false);
  assert.equal(satisfiesRequirement(["PAYMENT_MANAGE"], payments), true);
});

test("certificate workspace follows the method-level manage and verify policies", () => {
  const certificates = getRoutePermission("/certificates");
  const certificateDetail = getRoutePermission("/certificates/CERT-001");

  assert.equal(satisfiesRequirement(["CERTIFICATE_VIEW"], certificates), false);
  assert.equal(satisfiesRequirement(["CERTIFICATE_MANAGE"], certificates), true);
  assert.equal(
    satisfiesRequirement(["CERTIFICATE_VERIFY"], certificateDetail),
    true,
  );
  assert.equal(
    satisfiesRequirement(["CERTIFICATE_MANAGE"], certificateDetail),
    false,
  );
});

test("course creation follows COURSE_MANAGE and uses the public category catalog", () => {
  const createCourse = getRoutePermission("/courses/new");

  assert.equal(satisfiesRequirement(["COURSE_VIEW"], createCourse), false);
  assert.equal(satisfiesRequirement(["COURSE_MANAGE"], createCourse), true);
  assert.equal(PERMISSION.COURSE_SUBMIT_REVIEW, "COURSE_SUBMIT_REVIEW");
});

test("admin routes are denied by default until a policy is declared", () => {
  assert.equal(canAccessAdminRoute([], "/dashboard"), true);
  assert.equal(canAccessAdminRoute([], "/messages"), true);
  assert.equal(canAccessAdminRoute(["COURSE_VIEW"], "/courses"), true);
  assert.equal(canAccessAdminRoute(["COURSE_VIEW"], "/future-admin-page"), false);
});

test("support chat is declared permissionless for authenticated portal users", () => {
  const messages = getRoutePermission("/messages");

  assert.equal(messages?.title, "tin nhắn hỗ trợ");
  assert.equal(messages?.allOf, undefined);
  assert.equal(messages?.anyOf, undefined);
  assert.equal(satisfiesRequirement([], messages), true);
  assert.equal(canAccessAdminRoute([], "/messages"), true);
});
