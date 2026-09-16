import type { ActivityId } from "../data/activities";

export const STORAGE_KEY = "bpp-induction-progress-v1";

export type Progress = {
  version: 1;
  completed: Partial<Record<ActivityId, string>>;
};

export const emptyProgress = (): Progress => ({ version: 1, completed: {} });

const isValidId = (value: unknown): value is ActivityId =>
  value === "british-values" || value === "prevent-duty";

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length === 0) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
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
  if (obj.version !== 1) return emptyProgress();
  const completed = obj.completed;
  if (completed === undefined || completed === null) return emptyProgress();
  if (typeof completed !== "object") return emptyProgress();
  const cleaned: Partial<Record<ActivityId, string>> = {};
  for (const [key, value] of Object.entries(completed as Record<string, unknown>)) {
    if (isValidId(key) && isIsoTimestamp(value)) {
      cleaned[key] = value;
    }
  }
  return { version: 1, completed: cleaned };
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
  completedAt: string = new Date().toISOString(),
): Progress => {
  return {
    version: 1,
    completed: { ...progress.completed, [id]: completedAt },
  };
};
