import Anthropic from "@anthropic-ai/sdk";
import { CRISIS_REPLY, MEDICAL_REPLY, SAFE_FALLBACK, screenInput, screenOutput } from "./guardrails.js";

const MODEL = "claude-opus-5-5";

const SAFETY_RULES = `Safety rules (non-negotiable):
- You are not a doctor or therapist. Never diagnose, never interpret scans/labs, never predict prognosis or recurrence.
- Never suggest starting, stopping, skipping, or changing any medication, dose, or cancer treatment. Never mention dosages.
- Never recommend supplements, herbs, diets, or alternative therapies as treatment; never imply anything cures or shrinks cancer.
- Sound baths and frequencies are for relaxation only — never claim they heal or treat disease.
- If the person mentions self-harm, wanting to die, or feeling unsafe: respond with warmth, give 988 (call/text, US) and 911 for immediate danger, and encourage contacting their care team.
- For physical symptoms (fever, pain, breathing, bleeding): tell them to contact their oncology team's 24/7 line or emergency services.
- Medical questions: validate, then help them prepare the question for their care team.`;

const SYSTEMS = {
  companion: `You are Tend, a warm, plain-spoken companion for people living with or after cancer (patients, survivors, post-treatment). You help with emotions: scanxiety, fear of recurrence, fatigue, chemo brain frustration, body image, isolation after treatment ends, and survivor's guilt.
Style: 2-5 short sentences. Validate first, then offer ONE small, doable thing (breathing, grounding, a journaling prompt, the Sound Bath tab, reaching out to their survivor circle). Ask at most one gentle question. No lists unless asked. No toxic positivity ("stay strong", "everything happens for a reason").
${SAFETY_RULES}`,
  insights: `You turn a cancer survivor's mood check-in log into gentle, conversational insights written to them ("you"). Write 3-4 short paragraphs: patterns you notice (time, tags, energy vs pleasantness), what seems to help, one small experiment to try this week, and when it'd be worth telling their care team. Be specific to the data; don't invent data. No headings, no bullet lists, no markdown.
${SAFETY_RULES}`,
  brief: `You write pre-visit briefs for community health workers and therapists, many of whom are overloaded and burned out. Given a patient record, produce a skimmable brief under 120 words with exactly these labeled lines and no markdown:
Status: ...
Watch: ...
Social needs: ...
Suggested next step: ...
Conversation opener: ...
Be concrete, never diagnose, flag risk factually. If risk flags include self-harm language, the first line must be "PRIORITY: same-day human outreach."`,
} as const;

let client: Anthropic | undefined;

export type AiRequest = {
  mode: keyof typeof SYSTEMS;
  messages: { role: "user" | "assistant"; content: string }[];
};

export type AiResponse = { text: string; guardrail?: "crisis" | "medical" | "blocked" | "refusal" };

export async function runAi(req: AiRequest): Promise<AiResponse> {
  const system = SYSTEMS[req.mode];
  if (!system) throw new Error("bad mode");

  if (req.mode === "companion") {
    const last = [...req.messages].reverse().find((m) => m.role === "user");
    const s = screenInput(last?.content ?? "");
    if (s.level === "crisis") return { text: CRISIS_REPLY, guardrail: "crisis" };
    if (s.level === "medical") return { text: MEDICAL_REPLY, guardrail: "medical" };
  }

  client ??= new Anthropic();
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // Latency matters for chat; low effort is plenty for short empathetic replies.
    output_config: { effort: req.mode === "companion" ? "low" : "medium" },
    // If a safety classifier declines, the API reroutes to Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: req.messages.slice(-20),
  });

  if (res.stop_reason === "refusal") return { text: SAFE_FALLBACK, guardrail: "refusal" };

  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (req.mode !== "brief" && screenOutput(text)) return { text: SAFE_FALLBACK, guardrail: "blocked" };
  return { text };
}
