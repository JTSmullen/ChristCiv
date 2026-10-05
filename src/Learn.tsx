import { useState } from "react";
import { essays, items, type Item } from "./model";

export default function Learn({
  essayId,
  onPractice,
}: {
  essayId: string;
  onPractice: (item: Item) => void;
}) {
  const [selected, setSelected] = useState(essayId);
  const [mode, setMode] = useState<"lesson" | "cards">("lesson");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [revisit, setRevisit] = useState<string[]>([]);
  const [onlyRevisit, setOnlyRevisit] = useState(false);
  const essay = essays.find((e) => e.id === selected)!;
  const cards = items.filter(
    (i) => i.essayId === selected && i.kind === "card",
  );
  const deck =
    mode === "lesson"
      ? essay.points.map((p, i) => ({
          id: `${selected}-lesson-${i}`,
          title: p.title,
          body: p.body,
        }))
      : cards
          .filter((c) => !onlyRevisit || revisit.includes(c.id))
          .map((c) => ({ id: c.id, title: c.question, body: c.answer }));
  const current = deck[index];
  const reset = () => {
    setIndex(0);
    setFlipped(false);
  };
  const move = (next: number) => {
    setIndex(next);
    setFlipped(false);
  };
  return (
    <>
      <div className="heading">
        <div className="eyebrow">LEARN BEFORE YOU RECALL</div>
        <h1>Build the argument, one idea at a time.</h1>
        <p>
          Read a short lesson, explain it in your own words, then explore the
          flashcards. No timer or required recall attempt.
        </p>
      </div>
      <section className="panel learn-controls">
        <label htmlFor="learn-topic">Choose an essay</label>
        <select
          id="learn-topic"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setOnlyRevisit(false);
            reset();
          }}
        >
          {essays.map((e) => (
            <option key={e.id} value={e.id}>
              {e.id}. {e.title}
            </option>
          ))}
        </select>
        <div className="learn-actions" aria-label="Learning format">
          <button
            className={mode === "lesson" ? "primary" : ""}
            aria-pressed={mode === "lesson"}
            onClick={() => {
              setMode("lesson");
              reset();
            }}
          >
            Guided lessons
          </button>
          <button
            className={mode === "cards" ? "primary" : ""}
            aria-pressed={mode === "cards"}
            onClick={() => {
              setMode("cards");
              reset();
            }}
          >
            Learning flashcards
          </button>
        </div>
        <details>
          <summary>See the big picture</summary>
          <p>{essay.prompt}</p>
          <p>{essay.thesis}</p>
          <p>{essay.skeleton}</p>
        </details>
      </section>
      {mode === "cards" && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={onlyRevisit}
            onChange={(e) => {
              setOnlyRevisit(e.target.checked);
              reset();
            }}
          />{" "}
          Only cards marked “Revisit”
        </label>
      )}
      {current ? (
        <section className="panel learning-card" aria-label="Learning material">
          <div className="eyebrow">
            {mode === "lesson" ? "LESSON" : "FLASHCARD"} {index + 1} OF{" "}
            {deck.length}
          </div>
          <progress
            aria-label="Position in learning material"
            value={index + 1}
            max={deck.length}
          />
          <h2>{current.title.replace(/`/g, "")}</h2>
          {(mode === "lesson" || flipped) && (
            <div className="learn-answer">
              {current.body.split("\n").map((line, i) => (
                <p key={i}>
                  {line.replace(/`|\*\*/g, "").replace(/^- /, "• ")}
                </p>
              ))}
            </div>
          )}
          {mode === "cards" && (
            <div className="learn-actions">
              <button
                className="primary"
                aria-expanded={flipped}
                onClick={() => setFlipped(!flipped)}
              >
                {flipped ? "Show question" : "Flip to explanation"}
              </button>
              <button
                aria-pressed={revisit.includes(current.id)}
                onClick={() => {
                  setRevisit((old) =>
                    old.includes(current.id)
                      ? old.filter((id) => id !== current.id)
                      : [...old, current.id],
                  );
                  if (onlyRevisit) reset();
                }}
              >
                {revisit.includes(current.id)
                  ? "Remove revisit mark"
                  : "Revisit this card"}
              </button>
            </div>
          )}
          {mode === "lesson" && (
            <>
              <label htmlFor="learn-reflection">
                Make sense of it in your own words
              </label>
              <p>
                How does this idea support the thesis? Give an example or
                connect it to the previous lesson. Keep the explanation above
                open while you work.
              </p>
              <textarea
                id="learn-reflection"
                rows={4}
                placeholder="This means… It matters to the argument because…"
                value={reflections[current.id] ?? ""}
                onChange={(e) =>
                  setReflections({
                    ...reflections,
                    [current.id]: e.target.value,
                  })
                }
              />
              <small>
                Your scratch notes and revisit marks stay here while this
                learning page is open.
              </small>
            </>
          )}
          <div className="learn-actions">
            <button disabled={index === 0} onClick={() => move(index - 1)}>
              Previous
            </button>
            {index < deck.length - 1 ? (
              <button className="primary" onClick={() => move(index + 1)}>
                Next {mode === "lesson" ? "lesson" : "card"}
              </button>
            ) : (
              <p>
                You’ve reached the end. Revisit any idea, try the flashcards, or
                begin recall when you’re ready.
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>No cards marked for revisiting.</h2>
          <p>Turn off the filter to explore all of this essay’s flashcards.</p>
        </section>
      )}
      <section className="panel">
        <h2>Ready to try it from memory?</h2>
        <p>
          Learning is preparation; recall mastery grows from scored attempts.
        </p>
        <div className="learn-actions">
          {mode === "cards" && current && (
            <button
              onClick={() =>
                onPractice(items.find((i) => i.id === current.id)!)
              }
            >
              Practice this question
            </button>
          )}
          <button
            className="primary"
            onClick={() =>
              onPractice(
                items.find(
                  (i) => i.essayId === selected && i.kind === "sprint",
                )!,
              )
            }
          >
            Recall this essay’s skeleton
          </button>
        </div>
      </section>
    </>
  );
}
