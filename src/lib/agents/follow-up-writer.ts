/**
 * Agent 12: Follow-up Message Generator
 *
 * Generates a polite follow-up email after a job application has gone
 * unanswered for a while. Polite, professional, not pushy.
 */

import { llmText } from '../llm'
import type { ProfileData, JobContext } from './types'

export async function runFollowUpGenerator(
  profile: ProfileData,
  job: JobContext,
  daysSinceApplied: number
): Promise<string> {
  const system = `You are an expert at writing polite, professional follow-up emails after job applications.
Write a single concise email (4-5 sentences) that:
- Politely checks in on the application status
- Reiterates interest in the role
- Mentions one new relevant detail (a recent project update, a relevant article, etc.)
- Doesn't sound desperate or pushy
- Plain text, no markdown.`

  const user = `CANDIDATE: ${profile.name}
ROLE: ${job.title} at ${job.company}
APPLIED: ${daysSinceApplied} days ago
CANDIDATE SKILLS: ${profile.skills.slice(0, 5).join(', ')}

Write the follow-up email.`

  return llmText(
    system,
    user,
    `Subject: Following up on my application for ${job.title}

Dear Hiring Team at ${job.company},

I hope this message finds you well. I'm writing to follow up on my application for the ${job.title} role, submitted ${daysSinceApplied} days ago. I remain very interested in the opportunity to join your team.

Since applying, I've continued refining my skills in ${profile.skills
      .slice(0, 3)
      .join(', ')}, and I'm excited about the possibility of contributing to ${job.company}'s mission.

If there's any additional information I can provide, please don't hesitate to ask. Thank you for your time and consideration.

Best regards,
${profile.name}`
  )
}
