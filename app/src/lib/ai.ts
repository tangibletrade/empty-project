export type Msg = { role: "user" | "assistant"; content: string };
export type AiReply = { text: string; guardrail?: "crisis" | "medical" | "blocked" | "refusal" };

export async function askAi(mode: "companion" | "insights" | "brief", messages: Msg[]): Promise<AiReply> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "AI unavailable");
  return data;
}
