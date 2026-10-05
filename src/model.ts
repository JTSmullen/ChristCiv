import bundled from "./content.json";
export type Essay = (typeof bundled)[number];
export const essays: Essay[] = bundled;
export type Kind = "sprint" | "outline" | "card" | "contrast" | "exam";
export type Item = {
  id: string;
  essayId: string;
  kind: Kind;
  question: string;
  answer: string;
  points: { title: string; body: string }[];
};
const answers: string[][] = [
  [
    "Creation from nothing: God does not organize eternal matter; God alone is uncreated.",
    "God gives creation existence and depends on nothing; creation depends on God.",
    "The Logos gives order and intelligibility; the creating Word can also restore creation.",
    "God creates freely from goodness, not need. Matter is not intrinsically evil.",
    "Rationality and the capacity to know and contemplate God.",
    "Rational dominion includes ruling one’s passions; proper self-rule is human excellence.",
    "Image is given at creation; likeness grows through virtue.",
    "Free creatures can turn away from God, the source of life, toward corruption and death.",
  ],
  [
    "Evil is a corruption of created goodness, not a substance created by a good God.",
    "Darkness is absence of light; evil is privation or corruption of good.",
    "The claim that good and evil are equal eternal powers.",
    "God alone is ultimate; evil is no independent eternal substance.",
    "God gives the capacity to choose; creatures cause sinful choices and remain responsible.",
    "No. Sin disorders good capacities, choosing a lesser good over the proper good.",
    "A good rational creature becomes evil through choice; temptation does not remove human responsibility.",
    "Moral evil is sin and corruption of the soul. Illness, poverty, pain and death are not automatically moral evil.",
    "Pain can sometimes correct, discipline, warn or act as medicine without making God the author of wickedness.",
  ],
  [
    "Death/corruption threatens humanity; ignorance/idolatry destroys knowledge of God.",
    "God warned that rebellion leads to death; simply ignoring death would make the warning meaningless.",
    "Humans are God’s creation and image; their disappearance into corruption would be unfitting.",
    "Repentance changes behavior but does not restore dying human nature or reverse corruption.",
    "The Word who created humanity can re-create it; the Creator assumes a real human body.",
    "Christ truly dies but the divine Word cannot be held by death. Resurrection defeats death from within, preserving truthfulness and goodness.",
    "Humans turned from the invisible God to sensible things and idols.",
    "The invisible Word becomes visible to meet humans where their attention has turned.",
    "Teaching, miracles, power over creation and demons, and resurrection reveal the Word and lead to knowledge of the Father.",
  ],
  [
    "They relate directly to God, depend on grace and have God as their object.",
    "A good that is future, difficult and possible.",
    "Eternal life, union with God, salvation and fulfillment of the Kingdom.",
    "Hope takes sin, weakness, suffering, injustice and death seriously; resurrection means they are not final.",
    "Treating salvation as impossible: rejecting or forgetting divine grace. Grief alone is not despair.",
    "Self-reliance: I can save myself. Abusing mercy: salvation without repentance or transformation.",
    "Hope says salvation is possible through grace, neither automatic nor self-produced.",
    "Grace makes salvation possible, prompting perseverance, repentance, prayer, love and moral growth.",
  ],
  [
    "Christianity reduced to handling sin’s consequences rather than making whole-person disciples.",
    "Personal guilt before God.",
    "Forgiveness and getting into heaven after death.",
    "Accepting facts, doctrine or an atonement formula without trusting Jesus in everyday life.",
    "Oppression, inequality, injustice and harmful social structures.",
    "An ideal social or political order; Jesus reduced to a symbol of humanitarian ideals.",
    "Both manage sin’s consequences without necessarily transforming the sinner into a disciple.",
    "God’s effective rule: where what God wants done is done; available now and fulfilled later.",
    "Forgiveness, reconciliation and transformation: life with God now and forever.",
    "Actual trust in and reliance upon Jesus.",
    "An apprentice learning from Jesus how to live their own life.",
    "Now, as interactive knowledge and life with God; continuing beyond death.",
  ],
  [
    "How does the named condition relate to being blessed?",
    "Virtues or requirements to cultivate: become like this to be blessed.",
    "Mourning and persecution are painful states, not things one should seek to earn blessing.",
    "People are blessed despite their condition because the Kingdom is available.",
    "Grace: the Kingdom is available even to spiritually unimpressive, powerless or grieving people.",
    "Mercy, purity, peacemaking and hunger for righteousness are genuine virtues, not disadvantages.",
    "Challenges prestige and outward performance; emphasizes inward condition and genuine righteousness, as anger, lust and motives elsewhere in the Sermon.",
    "Different Beatitudes work differently: some name painful circumstances and others virtues; all announce the Kingdom.",
    "It handles diversity and preserves Willard’s grace insight without treating virtues as disadvantages. A student may defend another position with reasons.",
    "Who is really well off? Kingdom access overturns social judgments; even the hopeless or unimpressive can enter. Suffering itself does not become good.",
  ],
];
export const contrasts = [
  {
    essayId: "3",
    title: "Dilemma 1 vs dilemma 2",
    answer:
      "Dilemma 1: corruption and death; God’s truthfulness and goodness; repentance cannot reverse corruption; Incarnation, death and resurrection restore humanity. Dilemma 2: ignorance and idolatry; humans must know God yet attend to sensible things; the invisible Word becomes visible, revealing God through teaching, miracles and resurrection.",
  },
  {
    essayId: "4",
    title: "Despair vs hope vs presumption",
    answer:
      "Despair: salvation is impossible, overlooking grace. Hope: salvation is difficult but possible through God’s grace, prompting faithful action. Presumption: self-salvation or guaranteed mercy without repentance and transformation.",
  },
  {
    essayId: "5",
    title: "Right vs left vs Willard’s true gospel",
    answer: essays[4].outline,
  },
  {
    essayId: "6",
    title: "Prescriptive vs in-spite-of vs anti-Pharisaical vs spectrum",
    answer: essays[5].outline,
  },
  {
    essayId: "1",
    title: "Image vs likeness",
    answer:
      "Image is given in creation, connected to rationality and knowing God. Likeness is grown toward through virtue; Basil’s self-rule is part of proper human excellence.",
  },
  {
    essayId: "2",
    title: "Moral evil vs physical suffering",
    answer:
      "Moral evil is sin, vice and corruption of the soul through misused freedom. Physical suffering includes pain, illness, poverty, disaster and death; it is not automatically moral evil and can sometimes correct or discipline.",
  },
];
export const items: Item[] = essays.flatMap((e, ei) => [
  ...(["sprint", "outline", "exam"] as Kind[]).map((kind) => ({
    id: `${e.id}-${kind}`,
    essayId: e.id,
    kind,
    question: e.prompt,
    answer: kind === "sprint" ? e.skeleton : e.outline,
    points:
      kind === "sprint"
        ? e.skeleton.split(" → ").map((title) => ({ title, body: "" }))
        : e.points,
  })),
  ...e.questions.map((question, i) => ({
    id: `${e.id}-card-${i}`,
    essayId: e.id,
    kind: "card" as Kind,
    question,
    answer: answers[ei][i],
    points: [{ title: question, body: answers[ei][i] }],
  })),
]);
contrasts.forEach((c, i) =>
  items.push({
    id: `contrast-${i}`,
    essayId: c.essayId,
    kind: "contrast",
    question: c.title,
    answer: c.answer,
    points: [{ title: c.title, body: c.answer }],
  }),
);
export type Review = {
  id: string;
  essayId: string;
  kind: Kind;
  intervalDays: number;
  successfulRecallCount: number;
  lapseCount: number;
  dueAt: string;
  lastReviewedAt: string;
};
export type Attempt = {
  id: string;
  itemId: string;
  essayId: string;
  kind: Kind;
  date: string;
  prompt: string;
  response: string;
  confidence: number;
  score: number;
  missed: string[];
};
export type Settings = {
  examDate: string;
  sprint: number;
  outline: number;
  outlineTimer: boolean;
  phases: number[];
  theme: "light" | "dark";
};
export type State = {
  version: 1;
  reviews: Record<string, Review>;
  attempts: Attempt[];
  notes: Record<string, string>;
  settings: Settings;
};
export const initial = (): State => ({
  version: 1,
  reviews: {},
  attempts: [],
  notes: {},
  settings: {
    examDate: "",
    sprint: 120,
    outline: 7,
    outlineTimer: true,
    phases: [10, 60, 5],
    theme: "light",
  },
});
export function schedule(
  item: Item,
  old: Review | undefined,
  score: number,
  now = new Date(),
): Review {
  const intervalDays =
    score < 0.5
      ? 0
      : score < 0.85
        ? 1
        : Math.min(60, old?.intervalDays ? old.intervalDays * 2 : 3);
  return {
    id: item.id,
    essayId: item.essayId,
    kind: item.kind,
    intervalDays,
    successfulRecallCount:
      (old?.successfulRecallCount ?? 0) + (score >= 0.85 ? 1 : 0),
    lapseCount: (old?.lapseCount ?? 0) + (score < 0.5 ? 1 : 0),
    lastReviewedAt: now.toISOString(),
    dueAt: new Date(
      now.getTime() + (intervalDays ? intervalDays * 86400000 : 600000),
    ).toISOString(),
  };
}
export function mastery(s: State, id: string) {
  const list = items.filter((i) => i.essayId === id);
  return Math.round(
    (list.reduce(
      (a, i) =>
        a + Math.min(1, (s.reviews[i.id]?.successfulRecallCount ?? 0) / 3),
      0,
    ) /
      list.length) *
      100,
  );
}
export function pick(
  s: State,
  kind: Kind,
  last?: string,
  now = new Date(),
): Item {
  let pool = items.filter((i) => i.kind === kind);
  if (kind !== "exam") {
    const due = pool.filter(
      (i) => !s.reviews[i.id] || new Date(s.reviews[i.id].dueAt) <= now,
    );
    if (due.length) pool = due;
    const mixed = pool.filter((i) => i.essayId !== last);
    if (mixed.length) pool = mixed;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
export function validate(value: unknown): State {
  const s = value as State;
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.attempts) ||
    typeof s.reviews !== "object" ||
    !s.reviews ||
    typeof s.notes !== "object" ||
    !s.notes ||
    !s.settings
  )
    throw new Error("Not a Bluebook version 1 backup.");
  const finite = (n: unknown, min: number, max: number) =>
    typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
  if (
    !finite(s.settings.sprint, 60, 180) ||
    !finite(s.settings.outline, 5, 10) ||
    typeof s.settings.outlineTimer !== "boolean" ||
    !["light", "dark"].includes(s.settings.theme) ||
    typeof s.settings.examDate !== "string" ||
    !Array.isArray(s.settings.phases) ||
    s.settings.phases.length !== 3 ||
    !s.settings.phases.every((n) => finite(n, 1, 120))
  )
    throw new Error("Invalid settings.");
  for (const [id, r] of Object.entries(s.reviews))
    if (
      !items.some(
        (i) => i.id === id && i.essayId === r.essayId && i.kind === r.kind,
      ) ||
      !finite(r.intervalDays, 0, 60) ||
      !finite(r.successfulRecallCount, 0, 1e9) ||
      !finite(r.lapseCount, 0, 1e9) ||
      !Number.isFinite(Date.parse(r.dueAt)) ||
      !Number.isFinite(Date.parse(r.lastReviewedAt))
    )
      throw new Error("Invalid review data.");
  for (const a of s.attempts)
    if (
      !items.some(
        (i) =>
          i.id === a.itemId && i.essayId === a.essayId && i.kind === a.kind,
      ) ||
      typeof a.id !== "string" ||
      typeof a.prompt !== "string" ||
      typeof a.response !== "string" ||
      !Number.isFinite(Date.parse(a.date)) ||
      !finite(a.score, 0, 1) ||
      !finite(a.confidence, 1, 5) ||
      !Array.isArray(a.missed) ||
      !a.missed.every((m) => typeof m === "string")
    )
      throw new Error("Invalid attempt data.");
  if (
    !Object.entries(s.notes).every(
      ([id, n]) => essays.some((e) => e.id === id) && typeof n === "string",
    )
  )
    throw new Error("Invalid notes.");
  return s;
}
export const storageKey = "bluebook-v1";
export function read(): State {
  const text = localStorage.getItem(storageKey);
  return text ? validate(JSON.parse(text)) : initial();
}
