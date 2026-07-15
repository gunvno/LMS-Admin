import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/course-local-draft.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  COURSE_LOCAL_DRAFT_TTL_MS,
  clearCourseLocalDraft,
  getCourseLocalDraftKey,
  loadCourseLocalDraft,
  saveCourseLocalDraft,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

function createMemoryStorage() {
  const entries = new Map();
  return {
    entries,
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, value);
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
}

const draft = {
  name: "TypeScript căn bản",
  code: "TS-101",
  categoryId: "category-1",
  description: "Nội dung nháp",
  level: "BEGINNER",
  price: 250000,
};

test("stores and restores a versioned draft for only the current user", () => {
  const storage = createMemoryStorage();
  const now = 1_800_000_000_000;

  assert.equal(saveCourseLocalDraft(storage, "instructor-a", draft, now), true);
  assert.deepEqual(loadCourseLocalDraft(storage, "instructor-a", now + 1000), {
    status: "found",
    draft,
    savedAt: now,
  });
  assert.deepEqual(loadCourseLocalDraft(storage, "instructor-b", now + 1000), {
    status: "empty",
  });
  assert.notEqual(
    getCourseLocalDraftKey("instructor-a"),
    getCourseLocalDraftKey("instructor-b"),
  );
});

test("never serializes a thumbnail or unrelated fields", () => {
  const storage = createMemoryStorage();
  const now = 1_800_000_000_000;
  const inputWithThumbnail = { ...draft, thumbnail: "data:image/png;base64,secret" };

  assert.equal(saveCourseLocalDraft(storage, "instructor-a", inputWithThumbnail, now), true);
  const raw = storage.getItem(getCourseLocalDraftKey("instructor-a"));

  assert.equal(raw.includes("thumbnail"), false);
  assert.equal(raw.includes("data:image"), false);
});

test("removes corrupt, unsupported, and expired drafts", () => {
  const storage = createMemoryStorage();
  const key = getCourseLocalDraftKey("instructor-a");
  const now = 1_800_000_000_000;

  storage.setItem(key, "{broken-json");
  assert.deepEqual(loadCourseLocalDraft(storage, "instructor-a", now), { status: "invalid" });
  assert.equal(storage.getItem(key), null);

  storage.setItem(key, JSON.stringify({ version: 99, savedAt: now, data: draft }));
  assert.deepEqual(loadCourseLocalDraft(storage, "instructor-a", now), { status: "invalid" });
  assert.equal(storage.getItem(key), null);

  assert.equal(saveCourseLocalDraft(storage, "instructor-a", draft, now), true);
  assert.deepEqual(
    loadCourseLocalDraft(storage, "instructor-a", now + COURSE_LOCAL_DRAFT_TTL_MS + 1),
    { status: "expired" },
  );
  assert.equal(storage.getItem(key), null);
});

test("handles unavailable browser storage without throwing", () => {
  const unavailableStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(saveCourseLocalDraft(unavailableStorage, "instructor-a", draft), false);
  assert.deepEqual(loadCourseLocalDraft(unavailableStorage, "instructor-a"), {
    status: "unavailable",
  });
  assert.equal(clearCourseLocalDraft(unavailableStorage, "instructor-a"), false);
});

test("rejects malformed draft data before writing", () => {
  const storage = createMemoryStorage();
  assert.equal(
    saveCourseLocalDraft(storage, "instructor-a", { ...draft, price: Number.NaN }),
    false,
  );
  assert.equal(storage.entries.size, 0);
});
