import type { CourseLevel } from "@/services/course.service";

export const COURSE_LOCAL_DRAFT_VERSION = 1;
export const COURSE_LOCAL_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CourseLocalDraft {
  name: string;
  code: string;
  categoryId: string;
  description: string;
  level: CourseLevel;
  price: number;
}

interface CourseLocalDraftEnvelope {
  version: typeof COURSE_LOCAL_DRAFT_VERSION;
  savedAt: number;
  data: CourseLocalDraft;
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadCourseLocalDraftResult =
  | { status: "found"; draft: CourseLocalDraft; savedAt: number }
  | { status: "empty" | "expired" | "invalid" | "unavailable" };

const COURSE_LEVELS: readonly CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCourseLocalDraft(value: unknown): value is CourseLocalDraft {
  if (!isRecord(value)) return false;
  return typeof value.name === "string"
    && typeof value.code === "string"
    && typeof value.categoryId === "string"
    && typeof value.description === "string"
    && typeof value.level === "string"
    && COURSE_LEVELS.includes(value.level as CourseLevel)
    && typeof value.price === "number"
    && Number.isFinite(value.price)
    && value.price >= 0;
}

function isEnvelope(value: unknown): value is CourseLocalDraftEnvelope {
  if (!isRecord(value)) return false;
  return value.version === COURSE_LOCAL_DRAFT_VERSION
    && typeof value.savedAt === "number"
    && Number.isFinite(value.savedAt)
    && value.savedAt > 0
    && isCourseLocalDraft(value.data);
}

export function getCourseLocalDraftKey(userId: string): string | null {
  const normalizedUserId = userId.trim();
  return normalizedUserId
    ? `lms-admin:course-create-draft:v${COURSE_LOCAL_DRAFT_VERSION}:${encodeURIComponent(normalizedUserId)}`
    : null;
}

export function saveCourseLocalDraft(
  storage: DraftStorage,
  userId: string,
  draft: CourseLocalDraft,
  now = Date.now(),
): boolean {
  const key = getCourseLocalDraftKey(userId);
  if (!key || !Number.isFinite(now) || now <= 0 || !isCourseLocalDraft(draft)) return false;

  const envelope: CourseLocalDraftEnvelope = {
    version: COURSE_LOCAL_DRAFT_VERSION,
    savedAt: now,
    data: {
      name: draft.name,
      code: draft.code,
      categoryId: draft.categoryId,
      description: draft.description,
      level: draft.level,
      price: draft.price,
    },
  };

  try {
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearCourseLocalDraft(storage: DraftStorage, userId: string): boolean {
  const key = getCourseLocalDraftKey(userId);
  if (!key) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function loadCourseLocalDraft(
  storage: DraftStorage,
  userId: string,
  now = Date.now(),
  ttlMs = COURSE_LOCAL_DRAFT_TTL_MS,
): LoadCourseLocalDraftResult {
  const key = getCourseLocalDraftKey(userId);
  if (!key || !Number.isFinite(now) || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    return { status: "invalid" };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { status: "unavailable" };
  }
  if (raw === null) return { status: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearCourseLocalDraft(storage, userId);
    return { status: "invalid" };
  }

  if (!isEnvelope(parsed) || parsed.savedAt > now + 5 * 60 * 1000) {
    clearCourseLocalDraft(storage, userId);
    return { status: "invalid" };
  }
  if (now - parsed.savedAt > ttlMs) {
    clearCourseLocalDraft(storage, userId);
    return { status: "expired" };
  }

  return { status: "found", draft: parsed.data, savedAt: parsed.savedAt };
}
