import { useState } from "react";
import { QUADRANTS, type Quadrant } from "../lib/emotions";
import { useCheckIns } from "../lib/store";
import { askAi } from "../lib/ai";

export default function Journal() {
  const list = useCheckIns();
  const [insight, setInsight] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const counts = (["red", "yellow", "blue", "green"] as Quadrant[]).map((q) => [q, list.filter((c) => c.quadrant === q).length] as const);
  const tagCounts = Object.entries(
    list.flatMap((c) => c.tags).reduce<Record<string, number>>((a, t) => ((a[t] = (a[t] ?? 0) + 1), a), {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  async function generate() {
    setBusy(true);
    setErr("");
    const log = list
      .slice(-30)
      .map((c) => `${new Date(c.at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric" })} | ${c.quadrant} | ${c.word} | tags: ${c.tags.join(", ") || "none"} | note: ${c.note || "-"}`)
      .join("\n");
    try {
      const r = await askAi("insights", [{ role: "user", content: `My check-ins (oldest first):\n${log}` }]);
      setInsight(r.text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="label">[05] insights</div>
        <h1 className="mt-1 font-serif text-4xl leading-tight">Your weather, lately.</h1>
      </div>

      <div className="card p-4">
        <div className="label">last {list.length} check-ins</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {list.map((c) => (
            <div
              key={c.id}
              title={`${c.word} · ${new Date(c.at).toLocaleDateString()}`}
              className="size-6 rounded-full"
              style={{ background: QUADRANTS[c.quadrant].color, boxShadow: `0 0 12px ${QUADRANTS[c.quadrant].glow}` }}
            />
          ))}
        </div>
        <div className="mt-4 flex h-2 overflow-hidden rounded-full">
          {counts.map(([q, n]) => (
            <div key={q} style={{ width: `${(n / list.length) * 100}%`, background: QUADRANTS[q].color }} />
          ))}
        </div>
        {tagCounts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {tagCounts.map(([t, n]) => (
              <span key={t} className="chip">{t} <span className="text-amber">×{n}</span></span>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="label text-amber">conversational insight · claude opus 5.5</div>
        {insight ? (
          <div className="rise mt-3 space-y-3 font-serif text-lg leading-relaxed">
            {insight.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        ) : (
          <p className="mt-2 text-sm text-mute">Tend reads your check-ins and reflects back the patterns — what weighs on you, what helps, one small thing to try.</p>
        )}
        {err && <p className="mt-2 text-sm text-[#ff8a80]">{err}</p>}
        <button onClick={generate} disabled={busy} className="btn btn-amber mt-4 w-full">
          {busy ? "Reading your week…" : insight ? "Refresh insight" : "Show me my patterns"}
        </button>
      </div>

      <div className="space-y-2">
        <div className="label">journal</div>
        {[...list].reverse().map((c) => (
          <div key={c.id} className="card flex gap-3 p-3 text-sm">
            <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: QUADRANTS[c.quadrant].color }} />
            <div>
              <div>
                <b>{c.word}</b>{" "}
                <span className="text-mute">· {new Date(c.at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
              </div>
              {c.note && <div className="text-mute">{c.note}</div>}
              {c.tags.length > 0 && <div className="mt-1 font-mono text-[10px] tracking-wider text-amber uppercase">{c.tags.join(" · ")}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
