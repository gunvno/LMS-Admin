import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/course-creation-policy.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const { canUseCourseCreationAction, getServerCourseDraftStatus } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("COURSE_MANAGE capability can create a server draft without submission permission", () => {
  assert.equal(canUseCourseCreationAction("server-draft", true, false, false), true);
});

test("server draft status follows review permission, never a role name", () => {
  assert.equal(getServerCourseDraftStatus(false), "INSTRUCTOR_DRAFT");
  assert.equal(getServerCourseDraftStatus(true), "DRAFT");
});

test("submitting for review requires both manage and the explicit submit permission", () => {
  assert.equal(canUseCourseCreationAction("submit-review", true, false, false), false);
  assert.equal(canUseCourseCreationAction("submit-review", true, true, false), true);
  assert.equal(canUseCourseCreationAction("submit-review", false, true, true), false);
});

test("direct publish requires both course management and review capabilities", () => {
  assert.equal(canUseCourseCreationAction("publish", true, true, false), false);
  assert.equal(canUseCourseCreationAction("publish", false, true, true), false);
  assert.equal(canUseCourseCreationAction("publish", true, false, true), true);
});
