# Bluebook — Christian Thought

A complete local-first, retrieval-first exam trainer for six canonical Christian thought essay prompts. No backend, account, or AI/API is required.

## Install and run

Requires Node.js 20+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Production: `npm run build`, then `npx vite preview`. Checks: `npm test`, `npm run lint`, `npm run test:e2e` (install browsers once with `npx playwright install chromium`).

## Study design

The bundled skill references supply the exact prompts and canonical arguments. The app follows retrieval practice: attempt from memory, reveal corrective feedback, score concrete major points, identify misses, and revisit after a delay. It avoids automated keyword grading. Skeleton Sprints train argument order; Full Outline Recall trains scratch-paper planning; focused short-answer cards and six contrast drills repair specific gaps. Questions are interleaved across topics, preferring new or due items. Confidence is recorded before feedback and compared with self-scored recall.

Spaced scheduling is deterministic: missed (<50%) returns in 10 minutes; partial (<85%) in 1 day; solid in 3 days initially, doubling the previous interval up to 60 days. Each item’s mastery rises by one third for each solid recall, capped at three. Essay mastery averages its items. Passive notes viewing never increases mastery.

The exam room randomly draws an exact prompt for a default 75-minute simulation (10 outline / 60 write / 5 review). Handwrite Mode keeps a focused prompt/timer screen for 5–8 pages on physical paper; Typed Mode saves the essay. Both finish with canonical-outline self-grading. Timers use wall-clock deadlines, including when a tab is backgrounded; leaving an active attempt asks for confirmation. Unfinished attempts and their deadlines resume after reload; completed attempts, schedules, settings, and local note edits are also persisted.

Reference notes support search, disclosure panels, local editing, and resetting. Local edits do not overwrite canonical recall keys. Settings provide theme, exam date, timer customization, JSON export/import with validation and replacement confirmation, and confirmed progress reset. Progress includes mastery, misses, confidence calibration, daily successes, history, and upcoming reviews.

## Local data and offline use

`src/model.ts` contains typed persistence, validated backups, scheduling and mastery. `src/content.json` preserves the supplied theology content. `src/App.tsx` implements the study flows and `src/style.css` provides responsive light/dark styling with Tailwind. All data lives in localStorage on this browser/origin; export JSON to transfer or protect it. Storage failures display a backup warning. A service worker caches same-origin assets after first load; use the production build for offline use. Clearing browser data removes local progress. No network is needed for study after assets have loaded.

## Verification

- `npm test`: seven deterministic content, scheduling, mastery, and backup-validation tests.
- `npm run test:e2e`: seven Chromium tests covering answer hiding, all recall modes, self-scoring, persistence, handwrite and typed simulations, expiry, settings, JSON import, desktop/mobile layout, and unfinished-attempt restoration.
- `npm run test:offline`: production service-worker check, including offline reload and recall. Run `npm run build` first.
- `npm run lint` and `npm run build`: lint, strict TypeScript, and production bundle checks.

On minimal Linux installations, Chromium may need system dependencies: `npx playwright install --with-deps chromium` (requires package-install privileges). No browser dependencies are required to run the app in your existing browser.
