import OpenAI from 'openai'

/**
 * LLM client — uses the OpenAI SDK to call Google's Gemini 2.5 Flash
 * via the OpenAI-compatible endpoint.
 *
 * Env vars (either works):
 *   GEMINI_API_KEY  — preferred, Google AI Studio key
 *   OPENAI_API_KEY  — fallback name
 *
 * Model: gemini-2.5-flash
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/openai/
 */

let _client: OpenAI | null = null

export function getLLMClient(): OpenAI {
  if (_client) return _client
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'LLM API key not configured. Set GEMINI_API_KEY (or OPENAI_API_KEY) in .env'
    )
  }
  _client = new OpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  })
  return _client
}

export const LLM_MODEL = 'gemini-2.5-flash'

export function hasLLMKey(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
}

/**
 * Run an LLM completion that returns strict JSON.
 * Falls back to a deterministic stub if the SDK / network is unavailable.
 */
export async function llmJSON<T = any>(
  system: string,
  user: string,
  fallback: T
): Promise<T> {
  if (!hasLLMKey()) {
    return fallback
  }
  try {
    const client = getLLMClient()
    const resp = await client.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
    })
    const text = resp?.choices?.[0]?.message?.content ?? ''
    return extractJSON<T>(text, fallback)
  } catch (err) {
    console.error('[llmJSON] error, using fallback:', err)
    return fallback
  }
}

/**
 * Run an LLM completion that returns plain text (e.g. cover letter, resume).
 */
export async function llmText(
  system: string,
  user: string,
  fallback: string
): Promise<string> {
  if (!hasLLMKey()) {
    return fallback
  }
  try {
    const client = getLLMClient()
    const resp = await client.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.6,
    })
    const text = resp?.choices?.[0]?.message?.content ?? ''
    return text?.trim() ? text : fallback
  } catch (err) {
    console.error('[llmText] error, using fallback:', err)
    return fallback
  }
}

function extractJSON<T>(text: string, fallback: T): T {
  if (!text) return fallback
  // Strip markdown fences if present
  let t = text.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  }
  // Find first { ... } or [ ... ]
  const start = t.search(/[[{]/)
  if (start === -1) return fallback
  const opener = t[start]
  const closer = opener === '[' ? ']' : '}'
  const end = t.lastIndexOf(closer)
  if (end === -1 || end <= start) return fallback
  const slice = t.slice(start, end + 1)
  try {
    return JSON.parse(slice) as T
  } catch {
    return fallback
  }
}
