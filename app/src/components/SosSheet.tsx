import { usePersisted } from "../lib/store";

// Fixed, pre-written crisis resources — never model-generated.
export default function SosSheet({ onClose }: { onClose: () => void }) {
  const [plan, setPlan] = usePersisted("tend.safetyplan", {
    warning: "",
    calm: "",
    person: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="rise w-full max-w-md rounded-t-3xl border border-line bg-ink-2 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="label text-[#ff8a80]">[sos] you're not alone</div>
        <h2 className="mt-2 font-serif text-3xl">Reach a real person now</h2>
        <div className="mt-4 grid gap-2">
          <a href="tel:988" className="btn btn-amber text-center">Call or text 988 · Crisis Lifeline</a>
          <a href="sms:741741?body=HOME" className="btn btn-ghost text-center">Text HOME to 741741</a>
          <a href="tel:911" className="btn btn-ghost text-center">Immediate danger · 911</a>
        </div>
        <p className="mt-3 text-sm text-mute">
          Fever of 100.4°F / 38°C or higher, trouble breathing, or new severe pain? Call your oncology team's 24/7 line or 911 — not 988.
        </p>

        <div className="mt-5 border-t border-line pt-4">
          <div className="label">my safety plan</div>
          {(
            [
              ["warning", "My warning signs"],
              ["calm", "Things that calm me"],
              ["person", "Who I'll call"],
            ] as const
          ).map(([k, label]) => (
            <input
              key={k}
              value={plan[k]}
              onChange={(e) => setPlan({ ...plan, [k]: e.target.value })}
              placeholder={label}
              className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-amber"
            />
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full text-sm text-mute">Close</button>
      </div>
    </div>
  );
}
