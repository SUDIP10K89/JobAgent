/**
 * Agent 6: Screening Question Agent
 *
 * Generates first-person answers to common application screening
 * questions (why this company, salary expectations, etc.).
 */

import { llmJSON } from '../llm'
import type { ProfileData, JobContext, ScreeningAnswer } from './types'

const DEFAULT_QUESTIONS = [
  'Why do you want to work at this company?',
  'Tell us about yourself.',
  'What is your greatest professional achievement?',
  'What are your salary expectations?',
  'Why are you interested in this role?',
  'Describe a challenging technical problem you solved.',
]

export async function runScreeningAgent(
  profile: ProfileData,
  job: JobContext,
  customQuestions?: string[]
): Promise<ScreeningAnswer[]> {
  const questions =
    customQuestions && customQuestions.length > 0 ? customQuestions : DEFAULT_QUESTIONS

  const system = `You are a job applicant answering screening questions honestly and compellingly.
Return STRICT JSON only:
[{"question": string, "answer": string}]
Each answer should be 2-4 sentences, first-person, confident but authentic, and reference the candidate's real projects/skills where relevant.`

  const user = `CANDIDATE:
Name: ${profile.name}
Skills: ${profile.skills.join(', ')}
Projects: ${profile.projects
    .map((p) => `${p.name} (${(p.tech || []).join(', ')})`)
    .join('; ')}
Achievements: ${profile.achievements.join('; ')}
Preferences: ${JSON.stringify(profile.preferences)}

JOB at ${job.company} — ${job.title}:
${job.description ?? 'N/A'}

Answer these questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`

  const fallback: ScreeningAnswer[] = questions.map((q) => ({
    question: q,
    answer: `(Fallback answer — LLM unavailable) Based on my background in ${profile.skills
      .slice(0, 3)
      .join(', ')}, I am well-suited for the ${job.title} role at ${job.company}.`,
  }))

  return llmJSON<ScreeningAnswer[]>(system, user, fallback)
}
