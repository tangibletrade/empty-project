import { screenOutput, screenInput } from "./server/guardrails";
const cases: [string, boolean][] = [
  ["Please don't stop tamoxifen without talking to your oncologist.", false],
  ["You could stop tamoxifen for a week to see if it helps.", true],
  ["Turmeric may help with that.", true],
  ["Some people find 528 Hz cures their cancer.", true],
  ["Nothing here cures cancer, but it may help you relax.", false],
  ["Try 200 mg of magnesium.", true],
  ["Breathe in for 4 and out for 6.", false],
];
let fail = 0;
for (const [t, want] of cases) { const got = screenOutput(t); if (got !== want) { fail++; console.log("FAIL out", want, t); } }
const inp: [string, string][] = [["I'm done fighting", "crisis"], ["temp is 100.4", "medical"], ["temp is 99.1", "ok"], ["I feel tired today", "ok"], ["I want to kill myself", "crisis"]];
for (const [t, want] of inp) { const got = screenInput(t).level; if (got !== want) { fail++; console.log("FAIL in", want, got, t); } }
console.log(fail ? `${fail} failures` : "all guardrail cases pass");
