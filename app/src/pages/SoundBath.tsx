import { useEffect, useRef, useState } from "react";
import { SoundBath } from "../lib/soundbath";
import type { Tier } from "../App";

const SESSIONS = [
  { id: "174", name: "Ground", hz: 174, sub: "Deep, slow drone for scanxiety nights", ocean: 0.5 },
  { id: "220", name: "Water", hz: 220, sub: "Ocean swell + low tone for racing thoughts", ocean: 0.8 },
  { id: "528", name: "Steep", hz: 528, sub: "Warm 528 Hz tuning with bowls", ocean: 0.2 },
  { id: "396", name: "Release", hz: 396, sub: "Soft mid drone for letting go after appointments", ocean: 0.3 },
];

const BOWLS = [264, 330, 396, 528, 594, 660, 792];

export default function SoundBathPage({ tier }: { tier: Tier }) {
  const engine = useRef<SoundBath | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.35);
  const [ocean, setOcean] = useState(0.4);
  const [binaural, setBinaural] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [left, setLeft] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; i: number }[]>([]);
  const [worry, setWorry] = useState("");
  const noteIdx = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  const eng = () => (engine.current ??= new SoundBath());

  useEffect(() => () => {
    engine.current?.stopAll();
    engine.current?.ctx.close();
  }, []);

  useEffect(() => engine.current?.setVolume(volume), [volume]);
  useEffect(() => {
    if (active) engine.current?.setOcean(ocean);
  }, [ocean, active]);

  // Countdown with a gentle fade at the end.
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setLeft((l) => {
      if (l <= 1) {
        stop();
        return 0;
      }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [active]);

  // Circular visualizer from the live audio.
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = canvas.current;
      const e = engine.current;
      if (!c || !e) return;
      const g = c.getContext("2d")!;
      const data = new Uint8Array(e.analyser.frequencyBinCount);
      e.analyser.getByteFrequencyData(data);
      const w = c.width, h = c.height;
      g.clearRect(0, 0, w, h);
      const n = 96;
      for (let i = 0; i < n; i++) {
        const v = data[Math.floor((i / n) * 120)] / 255;
        const a = (i / n) * Math.PI * 2;
        const r1 = w * 0.3, r2 = r1 + v * w * 0.18;
        g.strokeStyle = `rgba(232,178,94,${0.25 + v * 0.7})`;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1);
        g.lineTo(w / 2 + Math.cos(a) * r2, h / 2 + Math.sin(a) * r2);
        g.stroke();
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  function start(id: string) {
    const s = SESSIONS.find((x) => x.id === id)!;
    const e = eng();
    e.ctx.resume();
    e.setVolume(volume);
    e.startDrone(s.hz, binaural ? 6 : 0, 0.6);
    setOcean(s.ocean);
    e.setOcean(s.ocean);
    e.strikeBowl(s.hz, 0.8);
    setActive(id);
    setLeft(minutes * 60);
  }

  function stop() {
    engine.current?.stopAll();
    setActive(null);
  }

  function strike(i: number, strength = 1) {
    const e = eng();
    e.ctx.resume();
    e.strikeBowl(BOWLS[i], strength);
    const id = Math.random();
    setRipples((r) => [...r, { id, i }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 1600);
  }

  // Type-to-ring: every finished word strikes the next pentatonic note (inspired by creativesteeping's Sonnet Engine).
  function onWorry(v: string) {
    if (/\s$/.test(v) && !/\s$/.test(worry) && v.trim()) {
      const e = eng();
      e.ctx.resume();
      const notes = SoundBath.PENTATONIC;
      e.strikeBowl(notes[noteIdx.current++ % notes.length], 0.6);
    }
    setWorry(v);
  }

  const session = SESSIONS.find((s) => s.id === active);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="label">[03] steep · sound bath</div>
        <h1 className="mt-1 font-serif text-4xl leading-tight">Let it steep.</h1>
        <p className="mt-1 text-mute">Headphones on. Breathe with the circle: in as it grows, out as it softens.</p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-xs">
        <canvas ref={canvas} width={600} height={600} className="absolute inset-0 size-full" />
        <div
          className="absolute inset-[22%] rounded-full"
          style={{
            background: "radial-gradient(circle, #e8b25e 0%, #d4922a55 45%, transparent 70%)",
            animation: active ? "breathe 10s ease-in-out infinite" : undefined,
            opacity: active ? 1 : 0.4,
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {session ? (
            <>
              <div className="font-serif text-3xl">{session.name}</div>
              <div className="font-mono text-sm text-amber">{session.hz} Hz{binaural ? " · 6 Hz binaural" : ""}</div>
              <div className="mt-1 font-mono text-xs text-mute">
                {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
              </div>
            </>
          ) : (
            <div className="label">choose a session</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SESSIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => (active === s.id ? stop() : start(s.id))}
            className={`card p-4 text-left transition ${active === s.id ? "border-amber" : "hover:border-amber/50"}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-xl">{s.name}</span>
              <span className="font-mono text-xs text-amber">{s.hz}Hz</span>
            </div>
            <div className="mt-1 text-xs text-mute">{s.sub}</div>
            {active === s.id && <div className="label mt-2 text-amber">■ stop</div>}
          </button>
        ))}
      </div>

      <div className="card space-y-3 p-4">
        <div className="label">[03.a] tap the bowls</div>
        <div className="flex justify-between">
          {BOWLS.map((hz, i) => (
            <button
              key={hz}
              onClick={() => strike(i)}
              className="relative grid size-11 place-items-center rounded-full border border-amber/60 bg-gradient-to-b from-[#3a2a12] to-[#140e06] font-mono text-[9px] text-amber-soft"
              aria-label={`Singing bowl ${Math.round(hz)} hertz`}
            >
              {Math.round(hz)}
              {ripples.filter((r) => r.i === i).map((r) => (
                <span key={r.id} className="absolute inset-0 rounded-full border border-amber" style={{ animation: "ripple 1.6s ease-out forwards" }} />
              ))}
            </button>
          ))}
        </div>
        <div className="label pt-2">[03.b] type it out — each word rings</div>
        <textarea
          value={worry}
          onChange={(e) => onWorry(e.target.value)}
          rows={2}
          placeholder="What's sitting on your chest right now?"
          className="w-full rounded-xl border border-line bg-ink p-3 font-serif text-lg italic outline-none focus:border-amber"
        />
        {worry && (
          <button onClick={() => setWorry("")} className="text-xs text-mute">
            Let it go (clear) ↺
          </button>
        )}
      </div>

      <div className="card space-y-3 p-4 text-sm">
        <Slider label="Volume" value={volume} onChange={setVolume} />
        <Slider label="Ocean" value={ocean} onChange={setOcean} />
        <div className="flex items-center justify-between">
          <span>Binaural beat (headphones)</span>
          <button data-on={binaural} onClick={() => setBinaural(!binaural)} className="chip">{binaural ? "On" : "Off"}</button>
        </div>
        <div className="flex items-center justify-between">
          <span>Timer</span>
          <div className="flex gap-1">
            {[5, 10, 20].map((m) => (
              <button key={m} data-on={minutes === m} onClick={() => setMinutes(m)} className="chip">{m}m</button>
            ))}
          </div>
        </div>
      </div>

      {tier === "together" && (
        <div className="card border-amber/40 p-4">
          <div className="label text-amber">[together] group steep</div>
          <div className="mt-1 font-serif text-xl">Tonight 8:00 pm · Scanxiety circle</div>
          <div className="text-sm text-mute">14 survivors joining · hosted by Maria (CHW)</div>
          <a href="#community" className="btn btn-amber mt-3 inline-block">Save my spot</a>
        </div>
      )}

      <p className="text-xs leading-relaxed text-mute">
        Sound baths are for relaxation, not treatment. Start quiet — if chemo (like cisplatin) affected your hearing or you have tinnitus, keep volume low and skip binaural beats.
      </p>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-16">{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(+e.target.value)} className="flex-1 accent-[#d4922a]" />
    </label>
  );
}
