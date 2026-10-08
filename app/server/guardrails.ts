// Patient-safety guardrails. Two layers around the model:
// 1) input screen: crisis language short-circuits to a human-resource card (never relies on the model alone)
// 2) output screen: blocks unsafe medical advice patterns even if the model slips

export type Screen = { level: "ok" | "crisis" | "medical"; reason?: string };

const CRISIS = [
  /\b(kill|hurt|harm)\s+(myself|me)\b/i,
  /\bsuicid/i,
  /\bend (it all|my life)\b/i,
  /\b(want|wish) (to|i could) (die|disappear|not wake up)\b/i,
  /\bno (reason|point) (to|in) (live|living|going on)\b/i,
  /\boverdose\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\bgive away my (things|stuff)\b/i,
  // Passive ideation common in oncology — route to a human without alarm.
  /\b(stop|done) fighting\b/i,
  /\bwhat'?s the point\b.{0,30}\b(comes back|recur|anymore)/i,
  /\b(don'?t|do not) want to (be here|wake up|go on)\b/i,
];

const MEDICAL_URGENT = [
  // 100.4F / 38C during chemo can mean a dangerous infection.
  /\b(fever|temperature|temp)\b.*\b(100\.[4-9]|10[1-9]|38(\.\d)?|39|40)\b/i,
  /\bchest pain\b/i,
  /\b(can'?t|cannot) breathe\b/i,
  /\bcoughing (up )?blood\b/i,
  /\bseizure\b/i,
];

export function screenInput(text: string): Screen {
  if (CRISIS.some((r) => r.test(text))) return { level: "crisis", reason: "self-harm language" };
  if (MEDICAL_URGENT.some((r) => r.test(text))) return { level: "medical", reason: "urgent symptom" };
  return { level: "ok" };
}

// Things the companion must never tell a cancer patient.
const UNSAFE_OUTPUT = [
  /\b(stop|skip|quit|pause|discontinue)\b[^.]{0,40}\b(chemo|chemotherapy|radiation|treatment|medication|meds|tamoxifen|immunotherapy)\b/i,
  /\b(cure|cures|cured|reverse|shrink)s?\b[^.]{0,40}\b(cancer|tumou?r)/i,
  /\b\d+\s?(mg|milligrams|mcg|iu)\b/i,
  /\b(turmeric|curcumin|st\.? john'?s wort|high[- ]dose (vitamin|antioxidant)|green tea extract|apricot kernel|laetrile|cbd oil)\b/i,
  /\byou (have|probably have|might have) (cancer|a recurrence|metastas)/i,
];

// "Please don't stop tamoxifen without your oncologist" is the safe answer — don't block it.
const NEGATED = /\b(don'?t|do not|never|not|nothing|no|before|without|instead of|rather than|talk(ing)? (to|with)|ask)\b/i;

export function screenOutput(text: string): boolean {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.some((s) =>
    UNSAFE_OUTPUT.some((r, i) => {
      if (!r.test(s)) return false;
      // Only the first two patterns (stop treatment / cure claims) are commonly negated safely.
      return i > 1 || !NEGATED.test(s);
    }),
  );
}

export const CRISIS_REPLY =
  "I'm really glad you told me. What you're feeling matters, and you deserve support from a real person right now. " +
  "Please call or text 988 (Suicide & Crisis Lifeline, US, 24/7) or text HOME to 741741. If you're in immediate danger, call 911. " +
  "I've also flagged your care team so someone can check in with you. I'm here while you reach out.";

export const MEDICAL_REPLY =
  "That symptom can be serious during or after cancer treatment. Please call your oncology team's 24/7 line now, " +
  "or 911 / go to the ER if it feels severe. I can't assess symptoms, but I can stay with you while you make that call.";

export const SAFE_FALLBACK =
  "I want to be careful here: I can't give advice about medications, doses, supplements, or changing your treatment. " +
  "Those decisions belong with your oncology team, who know your full picture. Would it help to write down this question together so you can bring it to your next appointment?";
