import { describe, it, expect } from "vitest";
import {
  essays,
  items,
  initial,
  schedule,
  mastery,
  pick,
  validate,
} from "./model";
describe("canonical content", () => {
  it("has six exact prompts and populated outlines, skeletons, answer cards and required contrasts", () => {
    expect(essays).toHaveLength(6);
    expect(essays[1].prompt).toBe(
      "Explain St. Basil's account of the nature, source, and scope of sin/evil.",
    );
    for (const e of essays) {
      expect(e.prompt.length).toBeGreaterThan(60);
      expect(e.points.length).toBeGreaterThan(5);
      expect(e.skeleton.split(" → ").length).toBeGreaterThan(7);
    }
    expect(items.filter((i) => i.kind === "contrast")).toHaveLength(6);
    for (const c of items.filter((i) => i.kind === "card"))
      expect(c.answer.length).toBeGreaterThan(20);
  });
});
describe("scheduler and mastery", () => {
  const item = items[0];
  const now = new Date("2026-10-04T12:00:00Z");
  it("brings failures back quickly and counts lapses", () => {
    const r = schedule(item, undefined, 0, now);
    expect(r.dueAt).toBe("2026-10-04T12:10:00.000Z");
    expect(r.lapseCount).toBe(1);
    expect(r.successfulRecallCount).toBe(0);
  });
  it("uses 1 day partial, 3 day solid, doubles and caps", () => {
    expect(schedule(item, undefined, 0.5, now).intervalDays).toBe(1);
    const r = schedule(item, undefined, 1, now);
    expect(r.intervalDays).toBe(3);
    expect(schedule(item, r, 1, now).intervalDays).toBe(6);
    expect(
      schedule(item, { ...r, intervalDays: 48 }, 1, now).intervalDays,
    ).toBe(60);
  });
  it("only successful attempts earn mastery", () => {
    const s = initial();
    expect(mastery(s, "1")).toBe(0);
    s.notes["1"] = "Read all notes";
    expect(mastery(s, "1")).toBe(0);
    for (const i of items.filter((i) => i.essayId === "1"))
      s.reviews[i.id] = {
        ...schedule(i, undefined, 1, now),
        successfulRecallCount: 3,
      };
    expect(mastery(s, "1")).toBe(100);
  });
  it("prefers due items and interleaves essays", () => {
    const s = initial();
    for (const i of items.filter((i) => i.kind === "sprint"))
      s.reviews[i.id] = schedule(i, undefined, 1, now);
    s.reviews["2-sprint"].dueAt = "2026-10-03T00:00:00Z";
    expect(pick(s, "sprint", "1", now).id).toBe("2-sprint");
    expect(pick(initial(), "outline", "1", now).essayId).not.toBe("1");
  });
});
describe("backup validation", () => {
  it("round-trips completed attempts, reviews, notes and settings", () => {
    const s = initial();
    s.notes["1"] = "My notes";
    s.reviews[items[0].id] = schedule(items[0], undefined, 1);
    s.attempts.push({
      id: "a",
      itemId: items[0].id,
      essayId: "1",
      kind: "sprint",
      date: new Date().toISOString(),
      prompt: items[0].question,
      response: "my recall",
      confidence: 4,
      score: 1,
      missed: [],
    });
    expect(validate(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("rejects malformed data without replacing current state", () => {
    for (const value of [
      null,
      {},
      { ...initial(), version: 2 },
      { ...initial(), settings: { ...initial().settings, sprint: 0 } },
      { ...initial(), attempts: [{}] },
      { ...initial(), notes: { "9": "x" } },
    ])
      expect(() => validate(value)).toThrow();
  });
});
