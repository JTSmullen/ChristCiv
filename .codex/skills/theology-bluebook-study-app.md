---
name: theology-bluebook-study-app
description: Build or improve a local-first React/TypeScript study app for a six-question Christian thought blue-book essay exam. Use retrieval practice, spaced review, corrective feedback, interleaving, confidence calibration, and timed handwritten exam simulation.
---

# Theology Blue-Book Study App

Build a study tool optimized for one goal:

> When one of six essay questions is randomly selected, the student can reconstruct the argument from memory and write a clear 5–8 page handwritten essay within 75 minutes.

Before implementation, read:

- `references/study-method.md`
- `references/essay-content.md`

Treat those files as the product requirements and canonical study content.

# Core Principle

This is not primarily a notes app or flashcard viewer.

It is a **retrieval-first exam trainer**.

The default study experience must force the student to attempt recall **before** seeing the answer.

Reference notes can exist, but the core experience should repeatedly require reconstructing:

- theses
- definitions
- argument sequences
- contrasts
- examples
- essay outlines

from memory.

# Technical Defaults

First inspect the repository.

If it is empty or has no frontend:

1. Scaffold a Vite + React + TypeScript app.
2. Use Tailwind CSS.
3. `lucide-react` may be used for icons.
4. Do not add a backend.
5. Do not add authentication.
6. Do not require any external AI API.
7. Store progress in `localStorage` through a typed persistence layer.
8. The app should remain useful offline after loading.

If a React/TypeScript project already exists, integrate with it instead of replacing unrelated work.

Use:

- functional React components
- strict TypeScript
- reusable components
- typed study content
- simple maintainable architecture

Avoid unnecessary abstractions.

# Required Features

## 1. Dashboard

Show:

- all six essay topics
- mastery percentage for each
- items due today
- weakest essay
- recent study activity
- `Start Recall Session`
- `Simulate Exam`
- optional exam date

Avoid excessive gamification.

Simple streaks and completion statistics are acceptable.

---

## 2. Skeleton Sprint

Purpose:

Rapidly reproduce the argument order from memory.

Flow:

1. Randomly select one essay question.
2. Hide all study notes and hints.
3. Show a blank text area.
4. Give a configurable timer between 60–180 seconds.
5. Student writes the compressed argument chain from memory.
6. Only after submission or timer expiry reveal the canonical skeleton.
7. Let the student self-score:
   - Missed
   - Partial
   - Got it
8. Show exactly what major links were missed.
9. Schedule the next review based on performance.

Prefer free recall over multiple choice.

---

## 3. Full Outline Recall

Purpose:

Practice producing the outline the student could write on scratch paper during the real exam.

Flow:

1. Show the exact essay prompt.
2. Give a blank outline editor.
3. Optional 5–10 minute timer.
4. Before revealing the answer, ask for confidence from 1–5.
5. On submission, display:
   - student's outline
   - canonical outline
6. Break the canonical outline into independently scorable major points.
7. Allow scoring:
   - 0 = missed/wrong
   - 1 = partial
   - 2 = solid
8. Calculate an overall score.
9. Display missed points.
10. Compare confidence against actual performance.

Do not pretend brittle keyword matching can reliably grade theology essays.

Self-scoring against a concrete checklist is the default.

Keyword highlighting may supplement self-grading but must not replace it.

---

## 4. Focused Recall Cards

Use short-answer questions.

Include:

- definitions
- distinctions
- argument transitions
- comparisons
- "why?" questions

Examples:

- Define `creatio ex nihilo`.
- Why is repentance alone insufficient in Athanasius's first dilemma?
- What does it mean to call evil a privation?
- Contrast hope, despair, and presumption.
- Contrast Willard's gospel on the right and left.
- Why does Ten Elshof criticize both the prescriptive and strict in-spite-of interpretations?

Answers remain hidden until an attempt is made.

---

## 5. Contrast Drills

Provide recall exercises for frequently confused material.

Include:

- Athanasius dilemma 1 vs dilemma 2
- despair vs hope vs presumption
- gospel on the right vs gospel on the left vs Willard's true gospel
- prescriptive vs in-spite-of vs anti-Pharisaical vs spectrum
- image vs likeness
- moral evil vs physical suffering

Start with blank fields or prompts.

Reveal the comparison only afterward.

---

## 6. Random Blue-Book Simulation

This should closely resemble the actual exam.

Requirements:

- randomly select 1 of the 6 exact prompts
- 75-minute countdown
- default phases:
  - 10 minutes outline
  - 60 minutes writing
  - 5 minutes review
- phase lengths can be customized

Provide two modes.

### Handwrite Mode

Designed for writing on physical paper.

Show only:

- large essay prompt
- countdown
- current phase
- next phase

Do not require typing the essay.

No study notes should be visible during the active simulation.

### Typed Mode

Allow the student to type an essay for practice.

After completion:

- reveal canonical outline
- allow self-grading
- save:
  - date
  - prompt
  - confidence
  - self-score
  - missed points

---

## 7. Reference Notes

Provide all six:

- prompts
- theses
- compressed skeletons
- canonical outlines
- contrasts
- recall questions

Reference notes are secondary to recall modes.

Allow:

- search
- expand/collapse
- local editing
- reset to bundled defaults

Passive note viewing must not increase mastery.

---

## 8. Progress

Show:

- mastery by essay
- successful recall history
- weakest essays
- frequently missed concepts
- confidence calibration
- successful recalls by day
- upcoming reviews

Keep charts simple.

CSS bars are preferable to adding a chart library unless one already exists.

---

## 9. Settings

Include:

- optional exam date
- timer settings
- theme
- export study progress/content as JSON
- import JSON
- reset progress with confirmation

# Spaced Review Scheduler

Use a transparent deterministic system.

Each study item should contain something similar to:

```ts
type StudyItemProgress = {
  id: string;
  essayId: string;
  kind: string;
  lastReviewedAt?: string;
  dueAt?: string;
  intervalDays: number;
  successfulRecallCount: number;
  lapseCount: number;
};