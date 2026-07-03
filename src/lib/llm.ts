import OpenAI from "openai";

let _openai: OpenAI | null = null;

export async function getOpenAI() {
  if (_openai) return _openai;

  _openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  return _openai;
}

/**
 * Run an LLM completion that returns strict JSON.
 * Falls back to a deterministic stub if the API fails.
 */
export async function llmJSON<T = any>(
  system: string,
  user: string,
  fallback: T
): Promise<T> {
  try {
    const openai = await getOpenAI();

    const resp = await openai.chat.completions.create({
      model: "gemini-2.5-flash", // or "gpt-5" if available on your account
      temperature: 0.4,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
    });

    const text = resp.choices[0]?.message?.content ?? "";

    return extractJSON<T>(text, fallback);
  } catch (err) {
    console.error("[llmJSON] error, using fallback:", err);
    return fallback;
  }
}

/**
 * Run an LLM completion that returns plain text.
 */
export async function llmText(
  system: string,
  user: string,
  fallback: string
): Promise<string> {
  try {
    const openai = await getOpenAI();

    const resp = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // or "gpt-5"
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
    });

    const text = resp.choices[0]?.message?.content ?? "";

    return text.trim() || fallback;
  } catch (err) {
    console.error("[llmText] error, using fallback:", err);
    return fallback;
  }
}

function extractJSON<T>(text: string, fallback: T): T {
  if (!text) return fallback;

  let t = text.trim();

  if (t.startsWith("```")) {
    t = t
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  const start = t.search(/[[{]/);

  if (start === -1) return fallback;

  const opener = t[start];
  const closer = opener === "[" ? "]" : "}";

  const end = t.lastIndexOf(closer);

  if (end === -1 || end <= start) return fallback;

  const slice = t.slice(start, end + 1);

  try {
    return JSON.parse(slice) as T;
  } catch {
    return fallback;
  }
}