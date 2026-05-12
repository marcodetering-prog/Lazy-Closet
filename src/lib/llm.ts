// Thin OpenAI-compatible client pointed at the server-side proxy.
// The proxy injects the real API key; this client only ships through
// the browser, never seeing the upstream secret.

const PROXY_BASE = "/api/llm";
const DEFAULT_MODEL = "deepseek-v4-flash";

type Role = "system" | "user" | "assistant";
export interface ChatMessage { role: Role; content: string; }

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  jsonMode?: boolean;
  systemInstruction?: string;
}

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const body: Record<string, unknown> = {
    model: opts.model || DEFAULT_MODEL,
    messages: opts.systemInstruction
      ? [{ role: "system", content: opts.systemInstruction }, ...messages]
      : messages,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(`${window.location.origin}${PROXY_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`LLM proxy ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// Convenience: ask for a JSON object and parse it. Returns null on parse failure.
export async function chatJson<T = unknown>(messages: ChatMessage[], opts: ChatOptions = {}): Promise<T | null> {
  const text = await chat(messages, { ...opts, jsonMode: true });
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback: extract first {...} block
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]) as T; } catch { return null; }
    }
    return null;
  }
}
