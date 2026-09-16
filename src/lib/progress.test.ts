import { describe, it, expect } from "vitest";
import {
  loadProgress,
  saveProgress,
  completeActivity,
  emptyProgress,
  STORAGE_KEY,
  type Progress,
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

describe("progress", () => {
  it("returns empty progress when storage is empty", () => {
    const store = makeStore();
    expect(loadProgress(store)).toEqual(emptyProgress());
    expect(loadProgress(store).completed).toEqual({});
  });

  it("round-trips a completed activity", () => {
    const store = makeStore();
    const id: ActivityId = "british-values";
    const at = "2026-01-02T03:04:05.000Z";
    const started = loadProgress(store);
    const completed = completeActivity(started, id, at);
    saveProgress(completed, store);
    const reloaded = loadProgress(store);
    expect(reloaded).toEqual(completed);
    expect(reloaded.completed[id]).toBe(at);
  });

  it("ignores malformed and wrong-version data", () => {
    const store = makeStore({
      [STORAGE_KEY]: "not-json",
    });
    expect(loadProgress(store)).toEqual(emptyProgress());
    const store2 = makeStore({
      [STORAGE_KEY]: JSON.stringify({ version: 2, completed: {} }),
    });
    expect(loadProgress(store2)).toEqual(emptyProgress());
    const store3 = makeStore({
      [STORAGE_KEY]: JSON.stringify({
        version: 1,
        completed: {
          "british-values": "not-a-date",
          bogus: "2026-01-02T03:04:05.000Z",
          "prevent-duty": 5,
        },
      }),
    });
    const loaded = loadProgress(store3);
    expect(loaded).toEqual(emptyProgress());
  });

  it("does not mutate progress when completing an activity", () => {
    const base: Progress = emptyProgress();
    const next = completeActivity(base, "prevent-duty", "2026-05-06T07:08:09.000Z");
    expect(base.completed).toEqual({});
    expect(next.completed).toEqual({ "prevent-duty": "2026-05-06T07:08:09.000Z" });
  });
});
