import { describe, it, expect } from "vitest";
import { getVerifiedCompletion, type XAPIEventLike } from "./h5p";

const makeEvent = (overrides: Partial<XAPIEventLike> = {}): XAPIEventLike => ({
  getVerb: () => "completed",
  data: {
    statement: {
      verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
      result: { completion: true },
      context: { contextActivities: { parent: [] } },
    },
  },
  ...overrides,
});

describe("getVerifiedCompletion", () => {
  it("accepts a genuine top-level completed event with score", () => {
    const event = makeEvent({
      data: {
        statement: {
          verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
          result: { completion: true, score: { raw: 18, max: 20 } },
          context: { contextActivities: { parent: [] } },
        },
      },
    });
    expect(getVerifiedCompletion(event)).toEqual({ raw: 18, max: 20 });
  });

  it("accepts a genuine scoreless completed event", () => {
    const event = makeEvent({
      data: {
        statement: {
          verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
          result: { completion: true },
          context: { contextActivities: { parent: [] } },
        },
      },
    });
    expect(getVerifiedCompletion(event)).toEqual({});
  });

  it("rejects an answered event", () => {
    const event = makeEvent({
      getVerb: () => "answered",
      data: {
        statement: {
          verb: { id: "http://adlnet.gov/expapi/verbs/answered" },
          result: { completion: true },
          context: { contextActivities: { parent: [] } },
        },
      },
    });
    expect(getVerifiedCompletion(event)).toBeNull();
  });

  it("rejects completion false", () => {
    const event = makeEvent({
      data: {
        statement: {
          verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
          result: { completion: false },
          context: { contextActivities: { parent: [] } },
        },
      },
    });
    expect(getVerifiedCompletion(event)).toBeNull();
  });

  it("rejects a child completed event with a parent", () => {
    const event = makeEvent({
      data: {
        statement: {
          verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
          result: { completion: true },
          context: { contextActivities: { parent: [{ id: "parent-id" }] } },
        },
      },
    });
    expect(getVerifiedCompletion(event)).toBeNull();
  });

  it("rejects a malformed score", () => {
    const event = makeEvent({
      data: {
        statement: {
          verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
          result: { completion: true, score: { raw: -1, max: 5 } },
          context: { contextActivities: { parent: [] } },
        },
      },
    });
    expect(getVerifiedCompletion(event)).toBeNull();
  });

  it("rejects a missing statement", () => {
    const event: XAPIEventLike = { getVerb: () => "completed", data: {} };
    expect(getVerifiedCompletion(event)).toBeNull();
  });

  it("rejects a malformed non-array parent context", () => {
    const event = makeEvent({
      data: {
        statement: {
          verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
          result: { completion: true },
          context: { contextActivities: { parent: { id: "parent-id" } } },
        },
      },
    });
    expect(getVerifiedCompletion(event)).toBeNull();
  });
});
