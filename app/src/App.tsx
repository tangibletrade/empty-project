import { useEffect, useState } from "react";
import CheckIn from "./pages/CheckIn";
import SoundBathPage from "./pages/SoundBath";
import Companion from "./pages/Companion";
import Journal from "./pages/Journal";
import Community from "./pages/Community";
import CareTeam from "./pages/CareTeam";
import SosSheet from "./components/SosSheet";
import { usePersisted } from "./lib/store";

export type Tab = "checkin" | "sound" | "companion" | "journal" | "community";
export type Tier = "solo" | "together";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "checkin", label: "Check in", icon: "◐" },
  { id: "sound", label: "Steep", icon: "◎" },
  { id: "companion", label: "Talk", icon: "❝" },
  { id: "journal", label: "Insights", icon: "≋" },
  { id: "community", label: "Circle", icon: "⁂" },
];

function useHash() {
  const [hash, setHash] = useState(location.hash.slice(1));
  useEffect(() => {
    const h = () => setHash(location.hash.slice(1));
    addEventListener("hashchange", h);
    return () => removeEventListener("hashchange", h);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [tier, setTier] = usePersisted<Tier>("tend.tier", "solo");
  const [sos, setSos] = useState(false);

  if (hash.startsWith("care")) return <CareTeam />;

  const tab = (TABS.find((t) => t.id === hash)?.id ?? "checkin") as Tab;
  const go = (t: string) => (location.hash = t);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col border-x border-line bg-ink">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <div className="font-serif text-2xl leading-none">
            Tend<span className="text-amber">.</span>
          </div>
          <div className="label mt-1">[life after cancer]</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-line p-0.5 text-xs" role="group" aria-label="Tier">
            {(["solo", "together"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`rounded-full px-3 py-1 font-mono uppercase tracking-wider ${tier === t ? "bg-amber text-ink" : "text-mute"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSos(true)}
            className="rounded-full bg-[#b3261e] px-3 py-1.5 font-mono text-xs font-medium tracking-wider"
            aria-label="Get help now"
          >
            SOS
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-6">
        {tab === "checkin" && <CheckIn go={go} />}
        {tab === "sound" && <SoundBathPage tier={tier} />}
        {tab === "companion" && <Companion onCrisis={() => setSos(true)} />}
        {tab === "journal" && <Journal />}
        {tab === "community" && <Community tier={tier} setTier={setTier} />}
      </main>

      <nav className="grid grid-cols-5 border-t border-line bg-ink-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${tab === t.id ? "text-amber" : "text-mute"}`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      <a href="#care" className="block bg-ink-3 py-1.5 text-center font-mono text-[10px] tracking-widest text-mute uppercase hover:text-amber">
        Care team portal →
      </a>

      {sos && <SosSheet onClose={() => setSos(false)} />}
    </div>
  );
}
