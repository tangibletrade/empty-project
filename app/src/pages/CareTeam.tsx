import { useMemo, useState } from "react";
import { QUADRANTS, type Quadrant } from "../lib/emotions";
import { useCheckIns, usePersisted } from "../lib/store";
import { askAi } from "../lib/ai";

type Need = { kind: string; stage: "identified" | "referred" | "connected" | "resolved" };
type Patient = {
  id: string;
  name: string;
  dx: string;
  area: string;
  phase: string;
  moods: Quadrant[];
  distress: number;
  lastSeenDays: number;
  flags: string[];
  needs: Need[];
  attempts: number;
  notes: string;
  live?: boolean;
};

const DEMO: Patient[] = [
  { id: "p1", name: "Rosa M.", dx: "Breast, stage II", area: "Eastside", phase: "18 mo post-treatment", moods: ["blue", "blue", "red", "blue", "blue"], distress: 7, lastSeenDays: 1, flags: ["Said 'what's the point if it comes back' (passive ideation)"], needs: [{ kind: "Transport", stage: "referred" }, { kind: "Food", stage: "identified" }], attempts: 0, notes: "Lives alone. Daughter out of state. Missed survivorship visit." },
  { id: "p2", name: "James T.", dx: "Colon, stage III", area: "Eastside", phase: "On adjuvant chemo", moods: ["red", "red", "blue", "red"], distress: 6, lastSeenDays: 0, flags: ["Fever mention in check-in note → routed to oncology line"], needs: [{ kind: "Cost of care", stage: "referred" }], attempts: 0, notes: "Works nights. Prefers text." },
  { id: "p3", name: "Aisha K.", dx: "Hodgkin lymphoma", area: "Northgate", phase: "Scan in 3 days", moods: ["green", "yellow", "red", "red"], distress: 5, lastSeenDays: 0, flags: [], needs: [], attempts: 0, notes: "Age 24. Joined Young adults circle." },
  { id: "p4", name: "Walter B.", dx: "Prostate", area: "Eastside", phase: "3 yrs post-treatment", moods: ["blue"], distress: 4, lastSeenDays: 9, flags: ["No check-in 9 days"], needs: [{ kind: "Housing", stage: "connected" }], attempts: 2, notes: "Veteran. Hard of hearing." },
  { id: "p5", name: "Mei L.", dx: "Thyroid", area: "Northgate", phase: "1 yr post-treatment", moods: ["yellow", "green", "green", "yellow", "green"], distress: 2, lastSeenDays: 0, flags: [], needs: [{ kind: "Utilities", stage: "resolved" }], attempts: 0, notes: "Peer mentor candidate." },
];

function riskOf(p: Patient) {
  if (p.flags.some((f) => /ideation|self-harm/i.test(f))) return { level: "Same day", color: "#ff6b6b", rank: 0 };
  if (p.distress >= 4 || p.flags.length) return { level: "48 hrs", color: "#ffd166", rank: 1 };
  return { level: "Routine", color: "#5fd3a3", rank: 2 };
}

export default function CareTeam() {
  const [role, setRole] = usePersisted<"chw" | "therapist">("tend.role", "chw");
  const checkins = useCheckIns();
  const [sel, setSel] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = usePersisted<string[]>("tend.tasks.done", []);

  // The patient using this browser shows up live — check in on the phone view and watch it land here.
  const you: Patient = useMemo(() => {
    const recent = checkins.slice(-6);
    const lastNote = recent.at(-1)?.note ?? "";
    const d = Number(/distress (\d+)/.exec(recent.map((c) => c.note).join(" "))?.[1] ?? 3);
    return {
      id: "you", name: "Alex (live demo)", dx: "Lymphoma", area: "Eastside", phase: "Post-treatment", live: true,
      moods: recent.map((c) => c.quadrant), distress: d,
      lastSeenDays: Math.floor((Date.now() - (recent.at(-1)?.at ?? Date.now())) / 86_400_000),
      flags: d >= 4 ? [`Self-reported distress ${d}/10`] : [],
      needs: [{ kind: "Cost of care", stage: "identified" }], attempts: 0,
      notes: `Recent words: ${recent.map((c) => c.word).join(", ")}. Last note: "${lastNote}"`,
    };
  }, [checkins]);

  const patients = [you, ...DEMO].sort((a, b) => riskOf(a).rank - riskOf(b).rank || b.distress - a.distress);
  const p = patients.find((x) => x.id === sel) ?? null;

  const tasks = patients.flatMap((pt) => {
    const r = riskOf(pt);
    const t: { id: string; text: string; due: string; color: string }[] = [];
    if (r.rank === 0) t.push({ id: `${pt.id}-call`, text: `Call ${pt.name} — warm check-in, review safety plan`, due: "Today", color: r.color });
    if (pt.lastSeenDays >= 7) t.push({ id: `${pt.id}-reach`, text: `Reach out to ${pt.name} (attempt ${pt.attempts + 1}/3)`, due: "48 hrs", color: "#ffd166" });
    pt.needs.filter((n) => n.stage === "identified").forEach((n) => t.push({ id: `${pt.id}-${n.kind}`, text: `Refer ${pt.name}: ${n.kind}`, due: "This week", color: "#5aa9ff" }));
    return t;
  });

  async function brief(pt: Patient) {
    setLoading(pt.id);
    const record = `Name: ${pt.name}\nDiagnosis: ${pt.dx}\nPhase: ${pt.phase}\nRecent moods (oldest→newest): ${pt.moods.join(", ")}\nDistress: ${pt.distress}/10\nDays since last check-in: ${pt.lastSeenDays}\nRisk flags: ${pt.flags.join("; ") || "none"}\nSocial needs: ${pt.needs.map((n) => `${n.kind} (${n.stage})`).join(", ") || "none"}\nOutreach attempts: ${pt.attempts}\nNotes: ${pt.notes}\nReader: ${role === "chw" ? "community health worker" : "licensed therapist"}`;
    try {
      const r = await askAi("brief", [{ role: "user", content: record }]);
      setBriefs((b) => ({ ...b, [pt.id]: r.text }));
    } catch (e) {
      setBriefs((b) => ({ ...b, [pt.id]: `Couldn't generate brief: ${e instanceof Error ? e.message : e}` }));
    } finally {
      setLoading(null);
    }
  }

  const flagged = patients.filter((x) => riskOf(x).rank < 2).length;

  return (
    <div className="min-h-full bg-ink">
      <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
        <a href="#checkin" className="font-serif text-2xl">Tend<span className="text-amber">.</span> <span className="label">care team</span></a>
        <div className="flex rounded-full border border-line p-0.5 text-xs">
          {(["chw", "therapist"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`rounded-full px-3 py-1 font-mono uppercase tracking-wider ${role === r ? "bg-amber text-ink" : "text-mute"}`}>
              {r === "chw" ? "Community health worker" : "Therapist"}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm text-mute">Maria R. · Eastside + Northgate</div>
      </header>

      <div className="grid gap-4 p-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat k="Patients" v={patients.length} />
            <Stat k="Need attention" v={flagged} accent />
            <Stat k="Check-ins today" v={patients.filter((x) => x.lastSeenDays === 0).length} />
            {role === "chw" ? (
              <Stat k="Open social needs" v={patients.flatMap((x) => x.needs).filter((n) => n.stage !== "resolved").length} />
            ) : (
              <Stat k="Prep time saved / wk" v="~3.5 h" />
            )}
          </div>

          {role === "therapist" && (
            <div className="card border-amber/40 p-4 text-sm">
              <div className="label text-amber">built for burnout</div>
              <p className="mt-1 text-mute">
                Patients self-regulate with check-ins and sound baths between sessions. You only see who needs you this week, with an AI brief instead of a chart dig. Every brief is drafted for you to review; nothing goes to a patient automatically.
              </p>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="label border-b border-line">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Mood trend</th>
                  <th className="p-3">Distress</th>
                  <th className="hidden p-3 md:table-cell">{role === "chw" ? "Social needs" : "Phase"}</th>
                  <th className="p-3">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((pt) => {
                  const r = riskOf(pt);
                  return (
                    <tr key={pt.id} onClick={() => setSel(pt.id)} className={`cursor-pointer border-b border-line/60 hover:bg-ink-3 ${sel === pt.id ? "bg-ink-3" : ""}`}>
                      <td className="p-3">
                        <div className="font-bold">{pt.name} {pt.live && <span className="ml-1 rounded bg-amber px-1.5 py-0.5 font-mono text-[9px] text-ink">LIVE</span>}</div>
                        <div className="text-xs text-mute">{pt.dx} · {pt.area}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {pt.moods.slice(-6).map((m, i) => <span key={i} className="size-3 rounded-full" style={{ background: QUADRANTS[m].color }} />)}
                        </div>
                        <div className="mt-1 text-xs text-mute">{pt.lastSeenDays === 0 ? "today" : `${pt.lastSeenDays}d ago`}</div>
                      </td>
                      <td className="p-3 font-mono">{pt.distress}/10</td>
                      <td className="hidden p-3 text-xs md:table-cell">
                        {role === "chw" ? pt.needs.map((n) => `${n.kind} · ${n.stage}`).join(", ") || "—" : pt.phase}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full px-2 py-1 font-mono text-[10px] text-ink" style={{ background: r.color }}>{r.level}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          {p ? (
            <div className="card rise space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-2xl">{p.name}</div>
                  <div className="text-sm text-mute">{p.dx} · {p.phase}</div>
                </div>
                <button onClick={() => setSel(null)} className="text-mute">✕</button>
              </div>
              {p.flags.map((f) => (
                <div key={f} className="rounded-xl border border-[#b3261e] bg-[#2a0f0d] p-2 text-sm">⚑ {f}</div>
              ))}
              <p className="text-sm text-mute">{p.notes}</p>
              {role === "chw" && p.needs.length > 0 && (
                <div className="space-y-1">
                  <div className="label">social needs pipeline</div>
                  {p.needs.map((n) => (
                    <div key={n.kind} className="flex items-center justify-between text-sm">
                      <span>{n.kind}</span>
                      <span className="flex gap-1">
                        {(["identified", "referred", "connected", "resolved"] as const).map((s, i, arr) => (
                          <span key={s} title={s} className="h-1.5 w-6 rounded-full" style={{ background: arr.indexOf(n.stage) >= i ? "#d4922a" : "#2c261e" }} />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-line pt-3">
                <div className="label text-amber">ai pre-visit brief · opus 5.5</div>
                {briefs[p.id] ? (
                  <div className="mt-2 space-y-1 text-sm whitespace-pre-line">{briefs[p.id]}</div>
                ) : (
                  <p className="mt-1 text-sm text-mute">Skip the chart dig: a 30-second read before you call.</p>
                )}
                <button onClick={() => brief(p)} disabled={loading === p.id} className="btn btn-amber mt-3 w-full text-sm">
                  {loading === p.id ? "Drafting…" : briefs[p.id] ? "Regenerate" : "Generate brief"}
                </button>
                <p className="mt-2 text-[11px] text-mute">AI-drafted. Review before acting. Not a clinical assessment.</p>
              </div>
            </div>
          ) : (
            <div className="card p-5 text-sm text-mute">Select a patient to see flags, social needs, and an AI brief.</div>
          )}

          <div className="card p-5">
            <div className="label">today's queue · sorted by urgency</div>
            <div className="mt-3 space-y-2">
              {tasks.map((t) => (
                <label key={t.id} className={`flex items-start gap-2 text-sm ${done.includes(t.id) ? "text-mute line-through" : ""}`}>
                  <input
                    type="checkbox"
                    checked={done.includes(t.id)}
                    onChange={() => setDone(done.includes(t.id) ? done.filter((x) => x !== t.id) : [...done, t.id])}
                    className="mt-1 accent-[#d4922a]"
                  />
                  <span className="flex-1">{t.text}</span>
                  <span className="font-mono text-[10px]" style={{ color: t.color }}>{t.due}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ k, v, accent }: { k: string; v: number | string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="label">{k}</div>
      <div className={`mt-1 font-serif text-3xl ${accent ? "text-amber" : ""}`}>{v}</div>
    </div>
  );
}
