/**
 * Agent 2: Job Matching Agent
 *
 * Acts as a senior technical recruiter — compares the candidate's profile
 * against a job description and returns a match score with strengths,
 * gaps, and interview probability.
 */

import { llmJSON } from '../llm'
import type { ProfileData, JobContext, MatchResult } from './types'

export async function runJobMatcher(
  profile: ProfileData,
  job: JobContext
): Promise<MatchResult> {
  const system = `You are a senior technical recruiter with 15+ years of experience matching engineering candidates to roles.
Analyze the candidate's profile against the job requirements.
Return STRICT JSON only — no prose, no markdown fences.
Schema:
{
  "score": number (0-100 integer),
  "missing_skills": string[],
  "strengths": string[],
  "weaknesses": string[],
  "probability_of_interview": number (0-100),
  "summary": string (1-2 sentences)
}`

  const user = `CANDIDATE PROFILE:
Name: ${profile.name}
Headline: ${profile.headline ?? ''}
Summary: ${profile.summary ?? ''}
Skills: ${profile.skills.join(', ')}
Projects: ${profile.projects
    .map((p) => `- ${p.name}: ${p.description ?? ''} (tech: ${(p.tech || []).join(', ')})`)
    .join('\n')}
Experience: ${profile.experience.map((e) => `- ${e.role} @ ${e.company}`).join('\n')}
Achievements: ${profile.achievements.join('; ')}

JOB:
Company: ${job.company}
Title: ${job.title}
Experience required: ${job.experience ?? 'Not specified'}
Location: ${job.location ?? 'Not specified'}
Description:
${job.description ?? 'No description provided'}

Score the match and identify gaps.`

  return llmJSON<MatchResult>(system, user, {
    score: 60,
    missing_skills: [],
    strengths: ['MERN stack experience'],
    weaknesses: ['Limited info on JD'],
    probability_of_interview: 50,
    summary: 'Fallback match score — LLM unavailable.',
  })
}
