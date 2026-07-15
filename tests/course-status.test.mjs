import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/course-status.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  canSubmitCourseForReview,
  getCourseStatusClass,
  getCourseStatusDescription,
  getCourseStatusLabel,
  isCourseStatus,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("recognizes and explains the private instructor draft status", () => {
  assert.equal(isCourseStatus("INSTRUCTOR_DRAFT"), true);
  assert.equal(getCourseStatusLabel("INSTRUCTOR_DRAFT"), "Bản nháp giảng viên");
  assert.match(getCourseStatusDescription("INSTRUCTOR_DRAFT"), /riêng/i);
  assert.equal(getCourseStatusClass("INSTRUCTOR_DRAFT"), "status-instructor-draft");
});

test("only draft and rejected courses can be submitted for review", () => {
  assert.equal(canSubmitCourseForReview("INSTRUCTOR_DRAFT"), true);
  assert.equal(canSubmitCourseForReview("DRAFT"), true);
  assert.equal(canSubmitCourseForReview("REJECTED"), true);
  assert.equal(canSubmitCourseForReview("PENDING_REVIEW"), false);
  assert.equal(canSubmitCourseForReview("PUBLISHED"), false);
});
