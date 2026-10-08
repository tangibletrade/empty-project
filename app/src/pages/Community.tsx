import { useState } from "react";
import type { Tier } from "../App";
import { usePersisted } from "../lib/store";

const CIRCLES = [
  { id: "after", name: "After the bell", desc: "Treatment's over. Now what?", members: 412 },
  { id: "scan", name: "Scanxiety", desc: "The week before results", members: 287 },
  { id: "aya", name: "Young adults (18–39)", desc: "Dating, fertility, careers", members: 156 },
  { id: "fog", name: "Chemo brain club", desc: "Lost keys, lost words, found people", members: 198 },
];

type Post = { id: string; who: string; circle: string; text: string; hugs: number; mine?: boolean; hugged?: boolean };

const SEED: Post[] = [
  { id: "1", who: "Dana · breast, 2 yrs out", circle: "after", text: "Ringing the bell felt like falling off a cliff. Nobody warned me the hard part starts after. Glad this group exists.", hugs: 41 },
  { id: "2", who: "Marcus · lymphoma, NED", circle: "scan", text: "Scan Thursday. Doing the 174 Hz steep every night this week. Anyone else want to check in Wednesday?", hugs: 23 },
  { id: "3", who: "Priya · colon, 8 mo out", circle: "fog", text: "Called my dog by my son's name today. Laughing instead of crying, which is progress 😅", hugs: 57 },
  { id: "4", who: "Lee · thyroid, 1 yr", circle: "aya", text: "First date since diagnosis. Told them on date 2. They stayed. Hope for whoever needs it.", hugs: 88 },
];

const EVENTS = [
  { when: "Tonight · 8:00 pm", what: "Group steep: Scanxiety circle", host: "Maria R., Community Health Worker" },
  { when: "Sat · 9:30 am", what: "Gentle survivor walk · Riverside Park", host: "Eastside CHW team" },
  { when: "Tue · 6:00 pm", what: "Fear of recurrence — peer support (virtual)", host: "Licensed therapist + 2 peer mentors" },
];

export default function Community({ tier, setTier }: { tier: Tier; setTier: (t: Tier) => void }) {
  const [posts, setPosts] = usePersisted<Post[]>("tend.posts", SEED);
  const [circle, setCircle] = useState("after");
  const [draft, setDraft] = useState("");
  const [rsvp, setRsvp] = usePersisted<string[]>("tend.rsvp", []);

  if (tier === "solo") {
    return (
      <div className="space-y-5 pt-2">
        <div className="label">[06] circle · together tier</div>
        <h1 className="font-serif text-4xl leading-tight">Healing is easier with people who get it.</h1>
        <div className="card space-y-3 p-5 text-sm">
          <Row k="Solo" v="Check-ins, sound baths, AI companion, private insights — all on your own terms." />
          <Row k="Together" v="Everything in Solo, plus survivor circles, group sound baths, peer buddies, and a community health worker who checks in." />
        </div>
        <button onClick={() => setTier("together")} className="btn btn-amber w-full">Switch to Together</button>
        <p className="text-xs text-mute">You stay anonymous by default. Your check-ins are only shared with your CHW if you say so.</p>
      </div>
    );
  }

  const visible = posts.filter((p) => p.circle === circle);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <div className="label">[06] circle</div>
        <h1 className="mt-1 font-serif text-4xl leading-tight">You're not the only one.</h1>
      </div>

      <div className="card flex items-center gap-4 p-4">
        <div className="grid size-12 place-items-center rounded-full bg-amber font-serif text-xl text-ink">D</div>
        <div className="flex-1 text-sm">
          <div className="label text-amber">your survivor buddy</div>
          <div><b>Dana</b> · also 2 yrs post-treatment, also hates scan weeks</div>
        </div>
        <button className="btn btn-ghost text-xs">Say hi</button>
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {CIRCLES.map((c) => (
          <button key={c.id} data-on={circle === c.id} onClick={() => setCircle(c.id)} className="chip shrink-0">
            {c.name} <span className="opacity-60">· {c.members}</span>
          </button>
        ))}
      </div>
      <p className="-mt-3 text-sm text-mute">{CIRCLES.find((c) => c.id === circle)?.desc}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setPosts([{ id: crypto.randomUUID(), who: "You", circle, text: draft.trim(), hugs: 0, mine: true }, ...posts]);
          setDraft("");
        }}
        className="flex gap-2"
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Share with the circle…" className="flex-1 rounded-full border border-line bg-ink-2 px-4 py-2 outline-none focus:border-amber" />
        <button className="btn btn-amber">Post</button>
      </form>

      <div className="space-y-3">
        {visible.map((p) => (
          <div key={p.id} className="card rise p-4">
            <div className="label">{p.who}</div>
            <p className="mt-1 leading-relaxed">{p.text}</p>
            <button
              onClick={() => setPosts(posts.map((x) => (x.id === p.id ? { ...x, hugs: x.hugs + (x.hugged ? -1 : 1), hugged: !x.hugged } : x)))}
              className={`mt-2 text-sm ${p.hugged ? "text-amber" : "text-mute"}`}
            >
              ♡ me too · {p.hugs}
            </button>
          </div>
        ))}
        {visible.length === 0 && <p className="text-sm text-mute">Be the first to share here.</p>}
      </div>

      <div className="space-y-2">
        <div className="label">gatherings</div>
        {EVENTS.map((e) => (
          <div key={e.what} className="card flex items-center gap-3 p-4">
            <div className="flex-1">
              <div className="font-mono text-xs text-amber">{e.when}</div>
              <div className="font-serif text-lg">{e.what}</div>
              <div className="text-xs text-mute">{e.host}</div>
            </div>
            <button
              data-on={rsvp.includes(e.what)}
              onClick={() => setRsvp(rsvp.includes(e.what) ? rsvp.filter((x) => x !== e.what) : [...rsvp, e.what])}
              className="chip"
            >
              {rsvp.includes(e.what) ? "Going" : "Join"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-mute">Circles are moderated by community health workers. Medical advice from peers isn't allowed — share experiences, not prescriptions.</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 shrink-0 font-mono text-xs tracking-wider text-amber uppercase">{k}</span>
      <span className="text-mute">{v}</span>
    </div>
  );
}
