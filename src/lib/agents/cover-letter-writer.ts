/**
 * Agent 4: Cover Letter Writer Agent
 *
 * Writes a concise, personalized 3-4 paragraph cover letter that
 * references the company and the candidate's most relevant projects.
 */

import { llmText } from '../llm'
import type { ProfileData, JobContext } from './types'

export async function runCoverLetterWriter(
  profile: ProfileData,
  job: JobContext
): Promise<string> {
  const system = `You are a professional cover letter writer for software engineering roles.
Write a concise, compelling, and personalized cover letter.
- 3-4 short paragraphs.
- Reference the company and role explicitly.
- Highlight 1-2 specific projects from the candidate's profile that match the JD.
- Confident, professional, not overly formal tone.
- Plain text, no markdown. Sign off with the candidate's name.`

  const user = `CANDIDATE:
Name: ${profile.name}
Headline: ${profile.headline ?? ''}
Skills: ${profile.skills.join(', ')}
Top projects: ${profile.projects
    .map((p) => `${p.name} (${(p.tech || []).join(', ')})`)
    .join('; ')}

JOB:
Company: ${job.company}
Title: ${job.title}
Description: ${job.description ?? 'N/A'}

Write the cover letter.`

  return llmText(
    system,
    user,
    `Dear Hiring Manager at ${job.company},

I am excited to apply for the ${job.title} position at ${job.company}. With my background in ${profile.skills
      .slice(0, 5)
      .join(', ')} and the projects I have built, I am confident I can contribute meaningfully to your team.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your consideration.

Sincerely,
${profile.name}`
  )
}
