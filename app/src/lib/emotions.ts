// Mood meter: energy (high/low) x pleasantness (unpleasant/pleasant), How We Feel style.
export type Quadrant = "red" | "yellow" | "blue" | "green";

export const QUADRANTS: Record<Quadrant, { label: string; hint: string; color: string; glow: string; words: string[] }> = {
  red: {
    label: "High energy · Unpleasant",
    hint: "Wired, on edge",
    color: "#ff6b6b",
    glow: "rgba(255,107,107,.35)",
    words: ["Anxious", "Scanxious", "Angry", "Overwhelmed", "Panicked", "Frustrated", "Restless", "Scared", "Irritable", "Jittery"],
  },
  yellow: {
    label: "High energy · Pleasant",
    hint: "Bright, buzzing",
    color: "#ffd166",
    glow: "rgba(255,209,102,.35)",
    words: ["Hopeful", "Grateful", "Proud", "Excited", "Relieved", "Energized", "Connected", "Brave", "Playful", "Inspired"],
  },
  blue: {
    label: "Low energy · Unpleasant",
    hint: "Heavy, drained",
    color: "#5aa9ff",
    glow: "rgba(90,169,255,.35)",
    words: ["Exhausted", "Lonely", "Numb", "Sad", "Foggy", "Hopeless", "Disconnected", "Grieving", "Invisible", "Discouraged"],
  },
  green: {
    label: "Low energy · Pleasant",
    hint: "Calm, settled",
    color: "#5fd3a3",
    glow: "rgba(95,211,163,.35)",
    words: ["Calm", "Rested", "Peaceful", "Content", "Safe", "Accepting", "Cozy", "Grounded", "Tender", "At ease"],
  },
};

// Cancer-specific context — what's behind the feeling.
export const CONTEXT_TAGS = [
  "Upcoming scan",
  "Fear of recurrence",
  "Fatigue",
  "Chemo brain",
  "Pain",
  "Body image",
  "Treatment ended",
  "Money / insurance",
  "Work",
  "Family",
  "Sleep",
  "Appointment",
];

export const STRATEGIES: Record<Quadrant, { title: string; body: string; tab?: string }[]> = {
  red: [
    { title: "Physiological sigh", body: "Two short inhales through the nose, one long exhale. Repeat 3 times.", },
    { title: "396 Hz release bath", body: "A 5-minute low drone to slow things down.", tab: "sound" },
    { title: "Name the worry", body: "Write the exact fear, then: 'What do I actually know today?'" },
  ],
  yellow: [
    { title: "Savor it", body: "Spend 20 seconds noticing where you feel this in your body." },
    { title: "Share a win", body: "Post it in your survivor circle — it helps others too.", tab: "community" },
    { title: "Bank it", body: "Note what led here so future-you can find it again." },
  ],
  blue: [
    { title: "Tiny movement", body: "Stand, stretch your arms overhead, three slow neck rolls." },
    { title: "Reach one person", body: "Send a single emoji to someone who gets it.", tab: "community" },
    { title: "Talk it through", body: "Tell the companion what feels heavy.", tab: "companion" },
  ],
  green: [
    { title: "528 Hz rest bath", body: "Settle deeper with a warm, gentle drone.", tab: "sound" },
    { title: "Body scan", body: "Move attention slowly from toes to crown." },
    { title: "Gratitude line", body: "One sentence about something small that went right." },
  ],
};
