import ZAI from 'z-ai-web-dev-sdk'

let _zai: any = null

export async function getZAI() {
  if (_zai) return _zai
  _zai = await ZAI.create()
  return _zai
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
  try {
    const zai = await getZAI()
    const resp = await zai.chat.completions.create({
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
  try {
    const zai = await getZAI()
    const resp = await zai.chat.completions.create({
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
