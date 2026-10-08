import type { IncomingMessage, ServerResponse } from "node:http";
import { runAi, type AiRequest } from "./ai.js";

const MODES = new Set(["companion", "insights", "brief"]);

export async function handleAi(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("content-type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("{}");
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  try {
    const parsed = JSON.parse(body) as AiRequest;
    if (!MODES.has(parsed.mode) || !Array.isArray(parsed.messages) || parsed.messages.length === 0)
      throw new Error("invalid request");
    const out = await runAi(parsed);
    res.end(JSON.stringify(out));
  } catch (e) {
    console.error("[ai]", e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : "error" }));
  }
}
