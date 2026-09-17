export type H5PCompletion = { raw?: number; max?: number };

export type XAPIEventLike = {
  getVerb?: () => string;
  data?: { statement?: Record<string, unknown> };
};

const isValidScore = (raw: unknown, max: unknown): boolean => {
  if (typeof raw !== "number" || typeof max !== "number") return false;
  if (!Number.isFinite(raw) || !Number.isFinite(max)) return false;
  if (raw < 0 || max <= 0 || raw > max) return false;
  return true;
};

export const getVerifiedCompletion = (event: XAPIEventLike): H5PCompletion | null => {
  const statement = event?.data?.statement;
  if (!statement || typeof statement !== "object") return null;

  const verb =
    typeof event.getVerb === "function"
      ? event.getVerb()
      : (statement as Record<string, unknown>)?.verb &&
        typeof (statement as Record<string, { id?: string }>).verb === "object"
        ? ((statement as Record<string, { id?: string }>).verb?.id ?? "").split("/").pop()
        : undefined;

  if (verb !== "completed") return null;

  const result = (statement as Record<string, unknown>)?.result;
  if (typeof result !== "object" || result === null) return null;
  const resultObj = result as Record<string, unknown>;
  if (resultObj.completion !== true) return null;

  const context = (statement as Record<string, unknown>)?.context;
  if (typeof context === "object" && context !== null) {
    const contextActivities = (context as Record<string, unknown>)?.contextActivities;
    if (typeof contextActivities === "object" && contextActivities !== null) {
      const parents = (contextActivities as Record<string, unknown>).parent;
      if (parents !== undefined && (!Array.isArray(parents) || parents.length > 0)) return null;
    }
  }

  const score = resultObj.score;
  if (score !== undefined) {
    if (typeof score !== "object" || score === null) return null;
    const scoreObj = score as Record<string, unknown>;
    if (!isValidScore(scoreObj.raw, scoreObj.max)) return null;
    return { raw: scoreObj.raw as number, max: scoreObj.max as number };
  }

  return {};
};
