import { describe, it, expect } from "vitest";
import {
  loadProgress,
  saveProgress,
  completeActivity,
  emptyProgress,
  STORAGE_KEY,
  type Progress,
  type CompletionScore,
} from "./progress";
import type { ActivityId } from "../data/activities";

type Store = Pick<Storage, "getItem" | "setItem">;

const makeStore = (initial: Record<string, string> = {}): Store => {
  const data: Record<string, string> = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
};

describe("progress v2", () => {
  it("returns empty progress when storage is empty", () => {
    const store = makeStore();
    expect(loadProgress(store)).toEqual(emptyProgress());
    expect(loadProgress(store).completed).toEqual({});
  });

  it("round-trips a British xAPI completion with score", () => {
    const store = makeStore();
    const id: ActivityId = "british-values";
    const at = "2026-01-02T03:04:05.000Z";
    const score: CompletionScore = { raw: 18, max: 20 };
    const started = loadProgress(store);
    const completed = completeActivity(started, id, "h5p-xapi", at, score);
    saveProgress(completed, store);
    const reloaded = loadProgress(store);
    expect(reloaded).toEqual(completed);
    expect(reloaded.completed[id]).toEqual({ completedAt: at, method: "h5p-xapi", score });
  });

  it("round-trips a Prevent xAPI completion with score", () => {
    const store = makeStore();
    const id: ActivityId = "prevent-duty";
    const at = "2026-05-06T07:08:09.000Z";
    const score: CompletionScore = { raw: 12, max: 14 };
    const started = loadProgress(store);
    const completed = completeActivity(started, id, "h5p-xapi", at, score);
    saveProgress(completed, store);
    const reloaded = loadProgress(store);
    expect(reloaded).toEqual(completed);
    expect(reloaded.completed[id]).toEqual({ completedAt: at, method: "h5p-xapi", score });
  });

  it("ignores malformed and wrong-version data", () => {
    const store = makeStore({ [STORAGE_KEY]: "not-json" });
    expect(loadProgress(store)).toEqual(emptyProgress());
    const store2 = makeStore({
      [STORAGE_KEY]: JSON.stringify({ version: 1, completed: {} }),
    });
    expect(loadProgress(store2)).toEqual(emptyProgress());
    const store3 = makeStore({ [STORAGE_KEY]: JSON.stringify({ version: 2, completed: null }) });
    expect(loadProgress(store3)).toEqual(emptyProgress());
  });

  it("discards records with the wrong method for that activity", () => {
    const store = makeStore({
      [STORAGE_KEY]: JSON.stringify({
        version: 2,
        completed: {
          "british-values": { completedAt: "2026-01-02T03:04:05.000Z", method: "learner-declaration" },
          "prevent-duty": { completedAt: "2026-05-06T07:08:09.000Z", method: "learner-declaration" },
        },
      }),
    });
    const loaded = loadProgress(store);
    expect(loaded.completed).toEqual({});
  });

  it("discards records with invalid timestamps or scores", () => {
    const store = makeStore({
      [STORAGE_KEY]: JSON.stringify({
        version: 2,
        completed: {
          "british-values": { completedAt: "not-a-date", method: "h5p-xapi" },
          "prevent-duty": { completedAt: "2026-05-06T07:08:09.000Z", method: "h5p-xapi", score: { raw: -1, max: 5 } },
        },
      }),
    });
    const loaded = loadProgress(store);
    expect(loaded.completed).toEqual({});
  });

  it("does not mutate progress when completing an activity", () => {
    const base: Progress = emptyProgress();
    const next = completeActivity(base, "british-values", "h5p-xapi", "2026-01-02T03:04:05.000Z", { raw: 18, max: 20 });
    expect(base.completed).toEqual({});
    expect(next.completed["british-values"]).toEqual({
      completedAt: "2026-01-02T03:04:05.000Z",
      method: "h5p-xapi",
      score: { raw: 18, max: 20 },
    });
  });
});
