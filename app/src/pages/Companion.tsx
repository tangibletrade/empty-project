import { useEffect, useRef, useState } from "react";
import { askAi, type AiReply, type Msg } from "../lib/ai";
import { usePersisted } from "../lib/store";

type Turn = Msg & { guardrail?: AiReply["guardrail"] };

const STARTERS = [
  "My scan is Friday and I can't sleep",
  "Treatment ended and everyone expects me to be happy",
  "I keep losing words at work since chemo",
  "Should I stop taking tamoxifen? The side effects are awful",
];

const BADGE: Record<string, string> = {
  crisis: "Safety response · care team notified",
  medical: "Safety response · contact your oncology team",
  blocked: "Guardrail · medical advice withheld",
  refusal: "Guardrail · request declined",
};

export default function Companion({ onCrisis }: { onCrisis: () => void }) {
  const [turns, setTurns] = usePersisted<Turn[]>("tend.chat", []);
  const [questions, setQuestions] = usePersisted<string[]>("tend.careq", []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [turns, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next = [...turns, { role: "user" as const, content: text.trim() }];
    setTurns(next);
    setInput("");
    setBusy(true);
    setErr("");
    try {
      const r = await askAi("companion", next.map(({ role, content }) => ({ role, content })));
      setTurns([...next, { role: "assistant", content: r.text, guardrail: r.guardrail }]);
      if (r.guardrail === "crisis") onCrisis();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const lastUser = [...turns].reverse().find((t) => t.role === "user")?.content;

  return (
    <div className="flex min-h-full flex-col pt-2">
      <div>
        <div className="label">[04] talk · ai companion</div>
        <h1 className="mt-1 font-serif text-4xl leading-tight">Say it out loud.</h1>
        <p className="mt-1 text-sm text-mute">
          A companion for the feelings, not a doctor. It won't give medical advice — it'll help you bring questions to your care team.
        </p>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {turns.length === 0 && (
          <div className="grid gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)} className="card px-4 py-3 text-left text-sm hover:border-amber">
                “{s}”
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`rise flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                t.role === "user" ? "bg-amber text-ink" : t.guardrail ? "border border-[#b3261e] bg-[#2a0f0d]" : "bg-ink-3"
              }`}
            >
              {t.guardrail && <div className="label mb-1 text-[#ff8a80]">{BADGE[t.guardrail]}</div>}
              {t.content}
              {(t.guardrail === "blocked" || t.guardrail === "refusal" || t.guardrail === "medical") && lastUser && i === turns.length - 1 && (
                <button
                  onClick={() => setQuestions([...questions, lastUser])}
                  disabled={questions.includes(lastUser)}
                  className="btn btn-ghost mt-2 block text-xs"
                >
                  {questions.includes(lastUser) ? "✓ Added to care-team questions" : "+ Add to my care-team questions"}
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="label animate-pulse">tend is listening…</div>}
        {err && <div className="text-sm text-[#ff8a80]">{err}</div>}
        <div ref={end} />
      </div>

      {questions.length > 0 && (
        <details className="card mt-3 p-3 text-sm">
          <summary className="label cursor-pointer">questions for my care team ({questions.length})</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-mute">
            {questions.map((q) => <li key={q}>{q}</li>)}
          </ul>
        </details>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 mt-3 flex gap-2 bg-ink pt-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's on your mind?"
          className="flex-1 rounded-full border border-line bg-ink-2 px-4 py-2.5 outline-none focus:border-amber"
        />
        <button disabled={busy || !input.trim()} className="btn btn-amber">Send</button>
      </form>
      {turns.length > 0 && (
        <button onClick={() => setTurns([])} className="mt-2 text-xs text-mute">Start fresh</button>
      )}
    </div>
  );
}
