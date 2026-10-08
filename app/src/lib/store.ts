import { useEffect, useState } from "react";
import type { Quadrant } from "./emotions";

export type CheckIn = {
  id: string;
  at: number;
  quadrant: Quadrant;
  word: string;
  tags: string[];
  note: string;
};

const KEY = "tend.checkins.v1";
const DAY = 86_400_000;

// Two weeks of plausible history so Insights has something to say on first run.
function seed(): CheckIn[] {
  const rows: [number, Quadrant, string, string[], string][] = [
    [13, "blue", "Exhausted", ["Fatigue", "Treatment ended"], "Everyone thinks I should be celebrating. I just feel wiped."],
    [12, "blue", "Lonely", ["Treatment ended"], "Miss the infusion nurses honestly."],
    [11, "green", "Calm", ["Sleep"], "Slept 7 hours!"],
    [10, "red", "Anxious", ["Fear of recurrence"], "Weird ache in my side."],
    [9, "yellow", "Grateful", ["Family"], "Walked with my sister."],
    [8, "blue", "Foggy", ["Chemo brain", "Work"], "Lost my words in a meeting."],
    [7, "green", "Peaceful", [], "Sound bath before bed helped."],
    [6, "red", "Scanxious", ["Upcoming scan"], "Scan in 5 days."],
    [5, "red", "Overwhelmed", ["Upcoming scan", "Money / insurance"], "Insurance denied the pre-auth again."],
    [4, "blue", "Exhausted", ["Fatigue", "Sleep"], ""],
    [3, "red", "Scared", ["Upcoming scan"], "Can't stop googling."],
    [2, "yellow", "Relieved", ["Appointment"], "NED. Cried in the car."],
    [1, "green", "Tender", ["Body image"], "Tried on old jeans."],
  ];
  return rows.map(([d, quadrant, word, tags, note], i) => ({
    id: `seed-${i}`,
    at: Date.now() - d * DAY + (i % 3) * 3_600_000,
    quadrant,
    word,
    tags,
    note,
  }));
}

function load(): CheckIn[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted storage — reseed */
  }
  const s = seed();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

const listeners = new Set<() => void>();
let cache: CheckIn[] | null = null;

export function getCheckIns() {
  return (cache ??= load());
}

export function addCheckIn(c: Omit<CheckIn, "id" | "at">) {
  cache = [...getCheckIns(), { ...c, id: crypto.randomUUID(), at: Date.now() }];
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function useCheckIns() {
  const [list, setList] = useState(getCheckIns);
  useEffect(() => {
    const l = () => setList(getCheckIns());
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return list;
}

export function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(v)), [key, v]);
  return [v, setV] as const;
}
