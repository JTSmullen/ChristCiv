import { useEffect, useState } from "react";
import Learn from "./Learn";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumn,
  Check,
  Clock,
  Feather,
  House,
  Layers,
  Settings as SettingsIcon,
  Shuffle,
} from "lucide-react";
import {
  essays,
  items,
  contrasts,
  initial,
  mastery,
  pick,
  read,
  schedule,
  storageKey,
  validate,
  type State,
  type Item,
  type Kind,
} from "./model";
const names: Record<Kind, string> = {
  sprint: "Skeleton Sprint",
  outline: "Full Outline Recall",
  card: "Focused Recall Cards",
  contrast: "Contrast Drills",
  exam: "Blue-Book Simulation",
};
const fmt = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.max(0, n % 60)
    .toString()
    .padStart(2, "0")}`;
function Rich({ text }: { text: string }) {
  return (
    <div className="rich">
      {text.split("\n").map((line, i) => {
        const clean = line.replace(/`|\*\*/g, "");
        if (/^#+ /.test(line))
          return <h4 key={i}>{clean.replace(/^#+ /, "")}</h4>;
        if (line.startsWith("- "))
          return (
            <p className="note-bullet" key={i}>
              • {clean.slice(2)}
            </p>
          );
        if (line === "---" || !line.trim()) return null;
        return <p key={i}>{clean.replace(/^> /, "")}</p>;
      })}
    </div>
  );
}
export default function App() {
  const [boot] = useState(() => {
    try {
      return { state: read(), error: "" };
    } catch {
      return {
        state: initial(),
        error:
          "Saved data could not be read. Import a valid backup to restore it.",
      };
    }
  });
  const [warning, setWarning] = useState(boot.error);
  const [state, setState] = useState<State>(boot.state);
  const [resume] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem("bluebook-draft") ?? "null");
      if (
        d &&
        items.some((i) => i.id === d.itemId) &&
        typeof d.response === "string"
      )
        return d as {
          itemId: string;
          response: string;
          confidence: number;
          hand: boolean;
          revealed: boolean;
          handFinished: boolean;
          scores: Record<number, number>;
          deadline: number | null;
          seconds: number;
          saved: boolean;
        };
    } catch {
      /* Ignore an invalid unfinished draft. */
    }
    return null;
  });
  const [page, setPage] = useState(resume ? "Practice" : "Dashboard");
  const [session, setSession] = useState<Item | null>(
    items.find((i) => i.id === resume?.itemId) ?? null,
  );
  const [hand, setHand] = useState(resume?.hand ?? true);
  const [handFinished, setHandFinished] = useState(
    resume?.handFinished ?? false,
  );
  const [response, setResponse] = useState(resume?.response ?? "");
  const [confidence, setConfidence] = useState(resume?.confidence ?? 3);
  const [revealed, setRevealed] = useState(resume?.revealed ?? false);
  const [scores, setScores] = useState<Record<number, number>>(
    resume?.scores ?? {},
  );
  const [deadline, setDeadline] = useState<number | null>(
    resume?.deadline ?? null,
  );
  const [seconds, setSeconds] = useState(resume?.seconds ?? 0);
  const [saved, setSaved] = useState(resume?.saved ?? false);
  const [learnEssay, setLearnEssay] = useState("1");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [reset, setReset] = useState(false);
  const [lastEssay, setLastEssay] = useState<string>();
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      setWarning(
        "Your browser could not save changes. Export a backup before leaving.",
      );
    }
    document.documentElement.dataset.theme = state.settings.theme;
  }, [state]);
  useEffect(() => {
    try {
      if (session)
        localStorage.setItem(
          "bluebook-draft",
          JSON.stringify({
            itemId: session.id,
            response,
            confidence,
            hand,
            revealed,
            handFinished,
            scores,
            deadline,
            seconds,
            saved,
          }),
        );
      else localStorage.removeItem("bluebook-draft");
    } catch {
      setWarning(
        "Could not save your unfinished attempt. Export your completed progress before leaving.",
      );
    }
  }, [
    session,
    response,
    confidence,
    hand,
    revealed,
    handFinished,
    scores,
    deadline,
    seconds,
    saved,
  ]);
  useEffect(() => {
    if (!deadline || revealed) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) {
        if (session?.kind === "exam" && hand) setHandFinished(true);
        else setRevealed(true);
        setDeadline(null);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, revealed, session, hand]);
  function start(kind: Kind, chosen?: Item) {
    const item = chosen ?? pick(state, kind, lastEssay);
    setLastEssay(item.essayId);
    setSession(item);
    setPage("Practice");
    setResponse("");
    setConfidence(3);
    setScores({});
    setRevealed(false);
    setSaved(false);
    setHandFinished(false);
    const duration =
      kind === "sprint"
        ? state.settings.sprint
        : kind === "outline" && state.settings.outlineTimer
          ? state.settings.outline * 60
          : kind === "exam"
            ? state.settings.phases.reduce((a, b) => a + b, 0) * 60
            : 0;
    setSeconds(duration);
    setDeadline(duration ? Date.now() + duration * 1000 : null);
  }
  function leave(p: string) {
    if (
      session &&
      !saved &&
      !window.confirm("Leave this attempt? Unsaved work will be discarded.")
    )
      return;
    setSession(null);
    setDeadline(null);
    setPage(p);
  }
  function save() {
    if (!session) return;
    const values = session.points.map((_, i) => scores[i]);
    if (values.some((v) => v === undefined)) return;
    const score = values.reduce((a, b) => a + b, 0) / (values.length * 2);
    const missed = session.points
      .filter((_, i) => scores[i] < 2)
      .map((p) => p.title);
    const now = new Date();
    setState((s) => ({
      ...s,
      reviews: {
        ...s.reviews,
        [session.id]: schedule(session, s.reviews[session.id], score, now),
      },
      attempts: [
        {
          id: crypto.randomUUID(),
          itemId: session.id,
          essayId: session.essayId,
          kind: session.kind,
          date: now.toISOString(),
          prompt: session.question,
          response,
          confidence,
          score,
          missed,
        },
        ...s.attempts,
      ],
    }));
    setSaved(true);
  }
  const due = items.filter(
    (i) =>
      i.kind !== "exam" &&
      (!state.reviews[i.id] ||
        new Date(state.reviews[i.id].dueAt) <= new Date()),
  );
  const weakest = [...essays].sort(
    (a, b) => mastery(state, a.id) - mastery(state, b.id),
  )[0];
  const average = Math.round(
    essays.reduce((n, e) => n + mastery(state, e.id), 0) / 6,
  );
  const isExam = session?.kind === "exam";
  const focus = isExam && hand && !revealed && !handFinished;
  const elapsed =
    state.settings.phases.reduce((a, b) => a + b, 0) * 60 - seconds;
  const phase =
    elapsed < state.settings.phases[0] * 60
      ? 0
      : elapsed < (state.settings.phases[0] + state.settings.phases[1]) * 60
        ? 1
        : 2;
  const score = session
    ? Math.round(
        (session.points.reduce((a, _, i) => a + (scores[i] ?? 0), 0) /
          (session.points.length * 2)) *
          100,
      )
    : 0;
  const nav = [
    { label: "Dashboard", icon: House },
    { label: "Learn", icon: BookOpen },
    { label: "Practice", icon: Layers },
    { label: "Exam room", icon: Feather },
    { label: "Reference notes", icon: BookOpen },
    { label: "Progress", icon: ChartNoAxesColumn },
    { label: "Settings", icon: SettingsIcon },
  ];
  return (
    <div className={focus ? "app focus" : "app"}>
      {!focus && (
        <aside>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              leave("Dashboard");
            }}
          >
            <BookOpen size={27} />
            <span>
              bluebook<small>CHRISTIAN THOUGHT</small>
            </span>
          </a>
          <div className="nav-label">YOUR STUDY SPACE</div>
          <nav>
            {nav.map(({ label, icon: Icon }) => (
              <button
                key={label}
                aria-current={page === label ? "page" : undefined}
                className={page === label ? "active" : ""}
                onClick={() => leave(label)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <span className="status-dot" /> Saved on this device
            <p>Quiet practice. Lasting understanding.</p>
            <small>No account. No cloud. Just your work.</small>
          </div>
        </aside>
      )}
      <main>
        {!focus && (
          <header>
            <span>
              CHRISTIAN THOUGHT <span className="slash">/</span> {page}
            </span>
            <span className="local">
              LOCAL-FIRST STUDY <span className="status-dot" />
            </span>
          </header>
        )}
        {warning && (
          <p role="alert" className="warning">
            {warning}
          </p>
        )}
        {page === "Dashboard" && (
          <>
            <div className="heading">
              <div className="eyebrow">RECALL. REFINE. REMEMBER.</div>
              <h1>Prepare to think on paper.</h1>
              <p>
                Six questions. One essay. Build the confidence to write it from
                memory.
              </p>
            </div>
            <section className="hero">
              <div>
                <div className="eyebrow">YOUR NEXT STUDY SESSION</div>
                <h2>
                  Learn the ideas.
                  <br />
                  Then make them your own.
                </h2>
                <p>
                  Start with guided lessons and flashcards, then reconstruct the
                  argument from memory.
                </p>
                <button className="primary" onClick={() => setPage("Learn")}>
                  Learn the material <BookOpen size={17} />
                </button>
                <button className="primary" onClick={() => start("sprint")}>
                  Start Recall Session <ArrowRight size={17} />
                </button>
                <button
                  className="exam-shortcut"
                  onClick={() => setPage("Exam room")}
                >
                  Simulate Exam
                </button>
                <span className="hero-caption">
                  New to a topic? Learn it first, then try a two-minute sprint.
                </span>
              </div>
              <div className="paper-art" aria-hidden="true">
                <div className="paper-top">THE BLUE BOOK</div>
                <Feather size={42} />
                <div className="paper-rule" />
                <div className="paper-rule short" />
                <div className="paper-number">01 — 06</div>
                <p>
                  From memory,
                  <br />
                  into meaning.
                </p>
              </div>
            </section>
            <div className="stats">
              <div>
                <span>OVERALL MASTERY</span>
                <strong>
                  {average}
                  <small>%</small>
                </strong>
                <p>Built through successful recall</p>
              </div>
              <div>
                <span>READY FOR REVIEW</span>
                <strong>
                  {due.length}
                  <small> items</small>
                </strong>
                <p>New and scheduled practice</p>
              </div>
              <div>
                <span>COMPLETED ATTEMPTS</span>
                <strong>{state.attempts.length}</strong>
                <p>
                  {state.settings.examDate
                    ? `Exam · ${state.settings.examDate}`
                    : "A little practice, consistently"}
                </p>
              </div>
            </div>
            <div className="section-heading">
              <h2>Your six essay questions</h2>
              <span>Build the argument, not a script</span>
            </div>
            <div className="essay-grid">
              {essays.map((e, i) => (
                <article className="essay-card" key={e.id}>
                  <div className="card-top">
                    <span className="number">0{i + 1}</span>
                    <span className="tag">
                      {mastery(state, e.id) ? "IN PROGRESS" : "READY TO BEGIN"}
                    </span>
                  </div>
                  <h3>{e.title}</h3>
                  <button
                    className="text-button"
                    onClick={() => {
                      setLearnEssay(e.id);
                      setPage("Learn");
                    }}
                  >
                    Learn this topic <ArrowRight size={15} />
                  </button>
                  <p>{e.prompt}</p>
                  <div className="mastery-label">
                    <span>Recall mastery</span>
                    <b>{mastery(state, e.id)}%</b>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${mastery(state, e.id)}%` }} />
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setQuery(e.title);
                      setPage("Reference notes");
                    }}
                  >
                    Explore reference <ArrowRight size={15} />
                  </button>
                </article>
              ))}
            </div>
            <div className="bottom-grid">
              <section className="panel">
                <div className="eyebrow">GIVE THIS SOME ATTENTION</div>
                <h3>{weakest.title}</h3>
                <p>
                  Your least practiced topic. Mix it into your next recall
                  session.
                </p>
                <button onClick={() => start("outline")}>
                  Practice an outline <ArrowRight size={15} />
                </button>
              </section>
              <section className="panel">
                <h3>Recent practice</h3>
                {state.attempts.length ? (
                  state.attempts.slice(0, 3).map((a) => (
                    <div className="activity" key={a.id}>
                      <span>
                        {names[a.kind]} · Essay {a.essayId}
                      </span>
                      <b>{Math.round(a.score * 100)}%</b>
                    </div>
                  ))
                ) : (
                  <p>
                    Your first attempt starts your history.
                    <br />
                    Reading alone won’t move your mastery.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
        {page === "Practice" && !session && (
          <>
            <div className="heading">
              <div className="eyebrow">MAKE RETRIEVAL A HABIT</div>
              <h1>Start with what you remember.</h1>
              <p>
                Attempt first. Compare honestly. Review again after a delay.
              </p>
            </div>
            <div className="mode-grid">
              {(["sprint", "outline", "card", "contrast"] as Kind[]).map(
                (k, i) => (
                  <section className="panel mode" key={k}>
                    <span className="number">0{i + 1}</span>
                    <h2>{names[k]}</h2>
                    <p>
                      {
                        [
                          "Rebuild the argument chain in 60–180 seconds.",
                          "Create the scratch-paper outline for a full essay.",
                          "Recall a definition, distinction, or reason in your own words.",
                          "Untangle ideas that are easy to confuse.",
                        ][i]
                      }
                    </p>
                    <button className="primary" onClick={() => start(k)}>
                      Begin practice <ArrowRight size={16} />
                    </button>
                  </section>
                ),
              )}
            </div>
            <section className="panel">
              <h3>A purposeful study loop</h3>
              <p>
                Sprint → full outline → 3–6 focused cards → contrast drill →
                retry a missed concept. Every few sessions, write a full timed
                essay.
              </p>
            </section>
          </>
        )}
        {page === "Exam room" && (
          <>
            <div className="heading">
              <div className="eyebrow">TRAIN FOR THE REAL THING</div>
              <h1>One question. Seventy-five minutes.</h1>
              <p>
                A randomly selected prompt. An honest rehearsal of the exam.
              </p>
            </div>
            <section className="panel exam-setup">
              <Feather size={36} />
              <h2>Your blue-book rehearsal</h2>
              <p>
                Aim for 5–8 handwritten pages. Keep notes closed throughout the
                attempt.
              </p>
              <div className="phase-grid">
                {["Outline", "Write", "Review"].map((p, i) => (
                  <div key={p}>
                    <strong>{state.settings.phases[i]} min</strong>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <fieldset>
                <legend>Practice format</legend>
                <label>
                  <input
                    type="radio"
                    name="format"
                    checked={hand}
                    onChange={() => setHand(true)}
                  />{" "}
                  Handwrite Mode · use physical paper
                </label>
                <label>
                  <input
                    type="radio"
                    name="format"
                    checked={!hand}
                    onChange={() => setHand(false)}
                  />{" "}
                  Typed Mode · write in the app
                </label>
              </fieldset>
              <button className="primary" onClick={() => start("exam")}>
                Draw a random prompt <Shuffle size={17} />
              </button>
              <p className="muted">
                Adjust phase lengths in Settings. Default total: 75 minutes.
              </p>
            </section>
          </>
        )}
        {session && (
          <section className="session">
            <div className="session-top">
              <span className="eyebrow">
                {names[session.kind]} · ESSAY {session.essayId}
              </span>
              {deadline !== null && (
                <span
                  className="timer"
                  role="timer"
                  aria-label="Time remaining"
                >
                  <Clock size={20} />
                  {fmt(seconds)}
                </span>
              )}
            </div>
            <h1>{session.question}</h1>
            {isExam && !revealed && (
              <div className="phase-label">
                Current: <b>{["Outline", "Write", "Review"][phase]}</b>{" "}
                <span>Next: {["Write", "Review", "Finish"][phase]}</span>
              </div>
            )}
            {!revealed && (
              <>
                {!focus && !(isExam && hand) && (
                  <>
                    <label className="editor-label" htmlFor="attempt">
                      Your {isExam ? "essay" : "recall attempt"}
                    </label>
                    <textarea
                      id="attempt"
                      autoFocus
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Begin from memory. Imperfect recall is where learning starts."
                      rows={isExam ? 18 : 10}
                    />
                    <fieldset className="confidence">
                      <legend>
                        How confident are you? Choose before revealing.
                      </legend>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n}>
                          <input
                            type="radio"
                            name="confidence"
                            checked={confidence === n}
                            onChange={() => setConfidence(n)}
                          />
                          {n}
                        </label>
                      ))}
                      <span>1 · uncertain / 5 · very confident</span>
                    </fieldset>
                  </>
                )}
                {focus ? (
                  <div className="hand-controls">
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Finish your handwritten attempt and begin self-grading?",
                          )
                        ) {
                          setHandFinished(true);
                          setDeadline(null);
                        }
                      }}
                    >
                      Finish attempt early
                    </button>
                  </div>
                ) : isExam && hand ? (
                  <>
                    <fieldset className="confidence">
                      <legend>
                        Before revealing, how confident are you in your
                        handwritten essay?
                      </legend>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n}>
                          <input
                            type="radio"
                            name="handconfidence"
                            checked={confidence === n}
                            onChange={() => setConfidence(n)}
                          />
                          {n}
                        </label>
                      ))}
                    </fieldset>
                    <button
                      className="primary"
                      onClick={() => setRevealed(true)}
                    >
                      Reveal outline & self-grade
                    </button>
                  </>
                ) : (
                  <button
                    className="primary"
                    disabled={!response.trim()}
                    onClick={() => {
                      setRevealed(true);
                      setDeadline(null);
                    }}
                  >
                    Submit & compare <ArrowRight size={17} />
                  </button>
                )}
              </>
            )}
            {revealed && (
              <>
                <div className="notice">
                  {!response.trim() && !isExam
                    ? "Time is up. Compare what you recalled; score anything you did not retrieve as missed."
                    : "Compare your recall with the canonical argument. Your judgment, not keyword matching, determines the score."}
                </div>
                <div className="comparison">
                  <section className="panel">
                    <div className="eyebrow">YOUR ATTEMPT</div>
                    <p className="preserve">
                      {response ||
                        (isExam && hand
                          ? "Compare the work on your physical paper."
                          : "No written response before the timer ended.")}
                    </p>
                  </section>
                  <section className="panel">
                    <div className="eyebrow">
                      CANONICAL{" "}
                      {session.kind === "sprint" ? "SKELETON" : "REFERENCE"}
                    </div>
                    <Rich text={session.answer} />
                  </section>
                </div>
                <h2>Identify every missing link.</h2>
                <p>
                  0 = missed or wrong · 1 = partial · 2 = solid. Score each
                  point before saving.
                </p>
                <div className="checklist">
                  {session.points.map((p, i) => (
                    <fieldset key={i}>
                      <legend>{p.title}</legend>
                      {p.body && <Rich text={p.body} />}
                      <div className="score-options">
                        {[0, 1, 2].map((n) => (
                          <label key={n}>
                            <input
                              disabled={saved}
                              type="radio"
                              name={`point-${i}`}
                              checked={scores[i] === n}
                              onChange={() =>
                                setScores((s) => ({ ...s, [i]: n }))
                              }
                            />
                            {session.kind === "sprint"
                              ? ["Missed", "Partial", "Got it"][n]
                              : ["0 · Missed", "1 · Partial", "2 · Solid"][n]}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
                <section className="panel result">
                  <h2>{score}% recalled</h2>
                  <p>
                    Confidence: {confidence}/5 ({(confidence - 1) * 25}%).{" "}
                    {Object.keys(scores).length === session.points.length
                      ? `Calibration gap: ${Math.abs((confidence - 1) * 25 - score)} percentage points.`
                      : "Finish the checklist to compare confidence with performance."}
                  </p>
                  <p>
                    <b>Needs review:</b>{" "}
                    {session.points
                      .filter(
                        (_, i) => scores[i] !== undefined && scores[i] < 2,
                      )
                      .map((p) => p.title)
                      .join(" · ") || "No scored misses yet."}
                  </p>
                  {saved ? (
                    <>
                      <p role="status">
                        <Check size={16} /> Attempt saved. Next review:{" "}
                        {new Date(
                          state.reviews[session.id].dueAt,
                        ).toLocaleString()}
                        .
                      </p>
                      <button
                        className="primary"
                        onClick={() => start(session.kind)}
                      >
                        Next mixed question <ArrowRight size={16} />
                      </button>
                      <button onClick={() => leave("Dashboard")}>
                        Return to dashboard
                      </button>
                    </>
                  ) : (
                    <button
                      className="primary"
                      disabled={
                        Object.keys(scores).length !== session.points.length
                      }
                      onClick={save}
                    >
                      Save score & schedule review
                    </button>
                  )}
                </section>
              </>
            )}
          </section>
        )}
        {page === "Learn" && (
          <Learn
            essayId={learnEssay}
            onPractice={(item) => start(item.kind, item)}
          />
        )}
        {page === "Reference notes" && (
          <>
            <div className="heading">
              <div className="eyebrow">THE CANONICAL ARGUMENTS</div>
              <h1>Your reference library.</h1>
              <p>
                Read to repair gaps. Then close the notes and retrieve again.
              </p>
            </div>
            <label htmlFor="search" className="editor-label">
              Search prompts, notes and recall questions
            </label>
            <input
              id="search"
              type="search"
              placeholder="Try “repentance”, “hope”, or “Kingdom”…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="reference-list">
              {essays
                .filter(
                  (e) =>
                    (state.notes[e.id] ?? e.notes)
                      .toLowerCase()
                      .includes(query.toLowerCase()) ||
                    e.title.toLowerCase().includes(query.toLowerCase()),
                )
                .map((e) => (
                  <details key={e.id}>
                    <summary>
                      <span className="number">0{e.id}</span>
                      {e.title}
                    </summary>
                    <p className="prompt">{e.prompt}</p>
                    <button
                      onClick={() => {
                        setLearnEssay(e.id);
                        setPage("Learn");
                      }}
                    >
                      Learn these notes step by step
                    </button>
                    {editing === e.id ? (
                      <>
                        <label htmlFor="notes">Edit your local notes</label>
                        <textarea
                          id="notes"
                          rows={24}
                          value={draft}
                          onChange={(v) => setDraft(v.target.value)}
                        />
                        <button
                          className="primary"
                          onClick={() => {
                            setState((s) => ({
                              ...s,
                              notes: { ...s.notes, [e.id]: draft },
                            }));
                            setEditing(null);
                          }}
                        >
                          Save notes
                        </button>
                        <button onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <Rich text={state.notes[e.id] ?? e.notes} />
                        <h4>Related contrasts</h4>
                        {contrasts
                          .filter((c) => c.essayId === e.id)
                          .map((c) => (
                            <div key={c.title}>
                              <b>{c.title}</b>
                              <Rich text={c.answer} />
                            </div>
                          ))}
                        <h4>Recall questions with corrective answers</h4>
                        {items
                          .filter(
                            (i) => i.essayId === e.id && i.kind === "card",
                          )
                          .map((i) => (
                            <details key={i.id}>
                              <summary>{i.question}</summary>
                              <Rich text={i.answer} />
                            </details>
                          ))}
                        <button
                          onClick={() => {
                            setEditing(e.id);
                            setDraft(state.notes[e.id] ?? e.notes);
                          }}
                        >
                          Edit local notes
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Reset these notes to the bundled canonical version?",
                              )
                            )
                              setState((s) => {
                                const notes = { ...s.notes };
                                delete notes[e.id];
                                return { ...s, notes };
                              });
                          }}
                        >
                          Reset notes
                        </button>
                        <p className="muted">
                          Edits apply to your reference notes. Recall answer
                          keys retain the canonical argument.
                        </p>
                      </>
                    )}
                  </details>
                ))}
            </div>
          </>
        )}
        {page === "Progress" && (
          <>
            <div className="heading">
              <div className="eyebrow">EVIDENCE, NOT FAMILIARITY</div>
              <h1>What you can recall.</h1>
              <p>
                Mastery grows with successful retrieval across spaced attempts.
              </p>
            </div>
            <div className="bottom-grid">
              <section className="panel">
                <h2>Mastery by essay</h2>
                {[...essays]
                  .sort((a, b) => mastery(state, a.id) - mastery(state, b.id))
                  .map((e) => (
                    <div className="progress-row" key={e.id}>
                      <div>
                        {e.title}
                        <b>{mastery(state, e.id)}%</b>
                      </div>
                      <div className="bar">
                        <i style={{ width: `${mastery(state, e.id)}%` }} />
                      </div>
                    </div>
                  ))}
                <p className="muted">
                  Each item earns one-third of its mastery per solid recall, up
                  to three successes. Reading earns none.
                </p>
              </section>
              <section className="panel">
                <h2>Confidence calibration</h2>
                <strong className="big-number">
                  {state.attempts.length
                    ? Math.round(
                        (state.attempts.reduce(
                          (a, x) =>
                            a + Math.abs((x.confidence - 1) / 4 - x.score),
                          0,
                        ) /
                          state.attempts.length) *
                          100,
                      )
                    : "—"}
                  <small> pts</small>
                </strong>
                <p>
                  Average gap between expected and recalled performance. Lower
                  means more accurate confidence.
                </p>
                <h3>Frequently missed concepts</h3>
                {Object.entries(
                  state.attempts
                    .flatMap((a) => a.missed)
                    .reduce<Record<string, number>>(
                      (r, m) => ({ ...r, [m]: (r[m] ?? 0) + 1 }),
                      {},
                    ),
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([m, n]) => (
                    <p key={m}>
                      {m} <b>×{n}</b>
                    </p>
                  ))}
                {!state.attempts.length && (
                  <p>
                    No attempts yet. Your next session creates the first
                    evidence.
                  </p>
                )}
              </section>
            </div>
            <section className="panel">
              <h2>Successful recalls by day</h2>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 6 + i);
                const count = state.attempts.filter(
                  (a) =>
                    new Date(a.date).toDateString() === d.toDateString() &&
                    a.score >= 0.85,
                ).length;
                return (
                  <div className="daily" key={i}>
                    <span>
                      {d.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="bar">
                      <i style={{ width: `${Math.min(100, count * 10)}%` }} />
                    </div>
                    <b>{count}</b>
                  </div>
                );
              })}
            </section>
            <section className="panel">
              <h2>Upcoming reviews</h2>
              <p>{due.length} new or due items ready now.</p>
              {Object.values(state.reviews)
                .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
                .slice(0, 12)
                .map((r) => (
                  <div className="activity" key={r.id}>
                    <span>{items.find((i) => i.id === r.id)?.question}</span>
                    <span>{new Date(r.dueAt).toLocaleString()}</span>
                  </div>
                ))}
              <p className="muted">
                Missed: 10 minutes. Partial: 1 day. Solid: 3 days, then double
                the previous interval (maximum 60 days). Due items are mixed
                across essays.
              </p>
            </section>
            <section className="panel">
              <h2>Recall history</h2>
              {state.attempts.map((a) => (
                <details key={a.id}>
                  <summary>
                    {new Date(a.date).toLocaleDateString()} · {names[a.kind]} ·
                    Essay {a.essayId} · {Math.round(a.score * 100)}%
                  </summary>
                  <p>{a.prompt}</p>
                  <p className="preserve">
                    {a.response || "Handwritten attempt"}
                  </p>
                  <p>
                    Confidence {a.confidence}/5 ·{" "}
                    {a.score >= 0.85
                      ? "Successful recall"
                      : "Needs further practice"}
                  </p>
                  <p>Missed/partial: {a.missed.join(" · ") || "None"}</p>
                </details>
              ))}
            </section>
          </>
        )}
        {page === "Settings" && (
          <>
            <div className="heading">
              <div className="eyebrow">MAKE ROOM FOR YOUR PRACTICE</div>
              <h1>Your study preferences.</h1>
              <p>
                Everything stays in this browser. Keep a backup for another
                device.
              </p>
            </div>
            <section className="panel settings">
              <h2>Schedule & timers</h2>
              <label>
                Exam date (optional)
                <input
                  type="date"
                  value={state.settings.examDate}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      settings: { ...s.settings, examDate: e.target.value },
                    }))
                  }
                />
              </label>
              <label>
                Skeleton Sprint · {state.settings.sprint} seconds
                <input
                  type="range"
                  min="60"
                  max="180"
                  step="10"
                  value={state.settings.sprint}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        sprint: Number(e.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label>
                Outline timer · {state.settings.outline} minutes
                <input
                  type="range"
                  min="5"
                  max="10"
                  value={state.settings.outline}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        outline: Number(e.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={state.settings.outlineTimer}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        outlineTimer: e.target.checked,
                      },
                    }))
                  }
                />{" "}
                Enable outline countdown
              </label>
              <div className="phase-grid">
                {["Outline", "Writing", "Review"].map((p, i) => (
                  <label key={p}>
                    {p} minutes
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={state.settings.phases[i]}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (n >= 1 && n <= 120)
                          setState((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              phases: s.settings.phases.map((v, j) =>
                                i === j ? Math.round(n) : v,
                              ),
                            },
                          }));
                      }}
                    />
                  </label>
                ))}
              </div>
              <p>
                Total exam time:{" "}
                {state.settings.phases.reduce((a, b) => a + b, 0)} minutes.
              </p>
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={state.settings.theme}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    settings: {
                      ...s.settings,
                      theme: e.target.value as "light" | "dark",
                    },
                  }))
                }
              >
                <option value="light">Paper · light</option>
                <option value="dark">Evening · dark</option>
              </select>
            </section>
            <section className="panel">
              <h2>Backup & restore</h2>
              <p>
                Export includes settings, attempts, schedules, edited reference
                notes, and bundled canonical content. Imports replace current
                progress after confirmation.
              </p>
              <button
                className="primary"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob(
                      [
                        JSON.stringify(
                          { ...state, canonicalContent: essays },
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    ),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `bluebook-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export JSON
              </button>
              <label className="import-label">
                Import JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const next = validate(JSON.parse(await file.text()));
                      if (
                        window.confirm(
                          "Replace current local study data with this backup?",
                        )
                      ) {
                        setState(next);
                        setWarning("Backup imported successfully.");
                      }
                    } catch (err) {
                      setWarning(
                        err instanceof Error
                          ? err.message
                          : "Unable to import backup.",
                      );
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            </section>
            <section className="panel">
              <h2>Reset progress</h2>
              <p>
                Remove recall history and review schedules. Your notes and
                preferences are retained.
              </p>
              {reset ? (
                <>
                  <p>Confirm clearing all study progress?</p>
                  <button
                    className="danger"
                    onClick={() => {
                      setState((s) => ({ ...s, attempts: [], reviews: {} }));
                      setReset(false);
                    }}
                  >
                    Yes, reset progress
                  </button>
                  <button onClick={() => setReset(false)}>Cancel</button>
                </>
              ) : (
                <button onClick={() => setReset(true)}>Reset progress…</button>
              )}
            </section>
          </>
        )}
        {!focus && (
          <footer>
            <BookOpen size={15} /> Built for understanding. Practiced from
            memory.<span>YOUR WORK STAYS WITH YOU</span>
          </footer>
        )}
      </main>
    </div>
  );
}
