import { useState } from "react";
import { CONTEXT_TAGS, QUADRANTS, STRATEGIES, type Quadrant } from "../lib/emotions";
import { addCheckIn, useCheckIns } from "../lib/store";

const ORDER: Quadrant[] = ["red", "yellow", "blue", "green"];

export default function CheckIn({ go }: { go: (t: string) => void }) {
  const history = useCheckIns();
  const [q, setQ] = useState<Quadrant | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [distress, setDistress] = useState(3);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setQ(null);
    setWord(null);
    setTags([]);
    setNote("");
    setDistress(3);
    setDone(false);
  };

  if (done && q && word) {
    return (
      <div className="rise space-y-4 pt-2">
        <div className="label">[02] stay or shift</div>
        <h1 className="font-serif text-3xl leading-tight">
          You're feeling <span style={{ color: QUADRANTS[q].color }}>{word.toLowerCase()}</span>.
        </h1>
        <p className="text-mute">Every feeling is allowed. If you want to shift it, here's something small:</p>
        {distress >= 4 && (
          <div className="card border-amber/50 p-4 text-sm">
            Your distress is at <b>{distress}/10</b>. Your community health worker has been notified so they can check in. You don't have to do anything.
          </div>
        )}
        <div className="grid gap-3">
          {STRATEGIES[q].map((s) => (
            <button key={s.title} onClick={() => s.tab && go(s.tab)} className="card p-4 text-left transition hover:border-amber">
              <div className="font-bold">{s.title}</div>
              <div className="mt-1 text-sm text-mute">{s.body}</div>
              {s.tab && <div className="label mt-2 text-amber">open →</div>}
            </button>
          ))}
        </div>
        <button onClick={reset} className="btn btn-ghost w-full">Done</button>
      </div>
    );
  }

  if (q && word) {
    return (
      <div className="rise space-y-5 pt-2">
        <button onClick={() => setWord(null)} className="label">← back</button>
        <h1 className="font-serif text-3xl">What's behind <span style={{ color: QUADRANTS[q].color }}>{word.toLowerCase()}</span>?</h1>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_TAGS.map((t) => (
            <button
              key={t}
              data-on={tags.includes(t)}
              onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
              className="chip"
            >
              {t}
            </button>
          ))}
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="label">distress thermometer</span>
            <span className="font-mono text-amber">{distress}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={distress}
            onChange={(e) => setDistress(+e.target.value)}
            className="mt-3 w-full accent-[#d4922a]"
            aria-label="Distress from 0 to 10"
          />
          <div className="mt-1 flex justify-between text-xs text-mute">
            <span>No distress</span>
            <span>Extreme</span>
          </div>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything else? (optional)"
          rows={3}
          className="w-full rounded-2xl border border-line bg-ink-2 p-3 outline-none focus:border-amber"
        />
        <button
          onClick={() => {
            addCheckIn({ quadrant: q, word, tags, note: note + (distress >= 4 ? ` [distress ${distress}/10]` : "") });
            setDone(true);
          }}
          className="btn btn-amber w-full"
        >
          Save check-in
        </button>
      </div>
    );
  }

  if (q) {
    const Q = QUADRANTS[q];
    return (
      <div className="rise space-y-5 pt-2">
        <button onClick={() => setQ(null)} className="label">← back</button>
        <h1 className="font-serif text-3xl">Which word fits best?</h1>
        <div className="grid grid-cols-2 gap-3">
          {Q.words.map((w) => (
            <button
              key={w}
              onClick={() => setWord(w)}
              className="rounded-2xl px-3 py-4 text-left font-bold text-ink transition hover:scale-[1.02]"
              style={{ background: Q.color, boxShadow: `0 8px 30px ${Q.glow}` }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const last = history.at(-1);
  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="label">[01] check in</div>
        <h1 className="mt-1 font-serif text-4xl leading-tight">How are you, really?</h1>
        <p className="mt-1 text-mute">Pick the space that matches your energy and mood.</p>
      </div>
      <div className="relative">
        <div className="grid grid-cols-2 gap-3">
          {ORDER.map((k) => {
            const Q = QUADRANTS[k];
            return (
              <button
                key={k}
                onClick={() => setQ(k)}
                className="aspect-square rounded-3xl p-4 text-left transition hover:scale-[1.02]"
                style={{ background: `radial-gradient(circle at 30% 30%, ${Q.color}, ${Q.color}99 60%, ${Q.color}55)`, boxShadow: `0 10px 40px ${Q.glow}` }}
              >
                <div className="font-serif text-2xl text-ink">{Q.hint}</div>
                <div className="mt-1 font-mono text-[10px] tracking-wider text-ink/70 uppercase">{Q.label}</div>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute top-1/2 -left-1 -translate-y-1/2 -rotate-90 font-mono text-[9px] tracking-widest text-mute">ENERGY</div>
      </div>
      {last && (
        <div className="card flex items-center gap-3 p-4 text-sm">
          <span className="size-3 rounded-full" style={{ background: QUADRANTS[last.quadrant].color }} />
          <span className="text-mute">
            Last check-in: <b className="text-cream">{last.word}</b> · {new Date(last.at).toLocaleDateString(undefined, { weekday: "short" })}
          </span>
          <span className="ml-auto font-mono text-xs text-amber">{streak(history.map((c) => c.at))}-day streak</span>
        </div>
      )}
    </div>
  );
}

function streak(times: number[]) {
  const days = new Set(times.map((t) => new Date(t).toDateString()));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
