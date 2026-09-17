import type { ActivityId } from "../data/activities";

export const STORAGE_KEY = "bpp-induction-progress-v2";

export type CompletionMethod = "h5p-xapi" | "learner-declaration";

export type CompletionScore = { raw: number; max: number };

export type CompletionRecord = {
  completedAt: string;
  method: CompletionMethod;
  score?: CompletionScore;
};

export type Progress = {
  version: 2;
  completed: Partial<Record<ActivityId, CompletionRecord>>;
};

export const emptyProgress = (): Progress => ({ version: 2, completed: {} });

const EXPECTED_METHOD: Record<ActivityId, CompletionMethod> = {
  "british-values": "h5p-xapi",
  "prevent-duty": "h5p-xapi",
};

const isValidId = (value: unknown): value is ActivityId =>
  value === "british-values" || value === "prevent-duty";

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length === 0) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const isValidScore = (value: unknown): value is CompletionScore => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const raw = v.raw;
  const max = v.max;
  if (typeof raw !== "number" || typeof max !== "number") return false;
  if (!Number.isFinite(raw) || !Number.isFinite(max)) return false;
  if (raw < 0 || max <= 0 || raw > max) return false;
  return true;
};

const sanitizeRecord = (id: ActivityId, value: unknown): CompletionRecord | null => {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!isIsoTimestamp(v.completedAt)) return null;
  const method = v.method;
  if (method !== EXPECTED_METHOD[id]) return null;
  const record: CompletionRecord = { completedAt: v.completedAt, method: method as CompletionMethod };
  if (v.score !== undefined) {
    if (!isValidScore(v.score)) return null;
    record.score = v.score as CompletionScore;
  }
  return record;
};

const sanitize = (raw: unknown): Progress => {
  if (typeof raw !== "string" || raw.length === 0) return emptyProgress();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (parsed === null || typeof parsed !== "object") return emptyProgress();
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== 2) return emptyProgress();
  const completed = obj.completed;
  if (completed === undefined || completed === null) return emptyProgress();
  if (typeof completed !== "object") return emptyProgress();
  const cleaned: Partial<Record<ActivityId, CompletionRecord>> = {};
  for (const [key, value] of Object.entries(completed as Record<string, unknown>)) {
    if (isValidId(key)) {
      const record = sanitizeRecord(key, value);
      if (record) cleaned[key] = record;
    }
  }
  return { version: 2, completed: cleaned };
};

export const loadProgress = (
  storage: Pick<Storage, "getItem"> = localStorage,
): Progress => sanitize(storage.getItem(STORAGE_KEY));

export const saveProgress = (
  progress: Progress,
  storage: Pick<Storage, "setItem"> = localStorage,
): void => {
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const completeActivity = (
  progress: Progress,
  id: ActivityId,
  method: CompletionMethod,
  completedAt: string = new Date().toISOString(),
  score?: CompletionScore,
): Progress => ({
  version: 2,
  completed: {
    ...progress.completed,
    [id]: { completedAt, method, ...(score ? { score } : {}) },
  },
});
