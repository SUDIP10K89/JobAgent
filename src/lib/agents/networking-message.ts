/**
 * Agent 10: Networking Message Generator
 *
 * Generates LinkedIn connection requests + follow-up messages for
 * recruiters at target companies.
 */

import { llmText } from '../llm'
import type { ProfileData, JobContext } from './types'

export async function runNetworkingMessageGenerator(
  profile: ProfileData,
  job: JobContext
): Promise<string> {
  const system = `You are an expert at writing LinkedIn outreach messages that get responses.
Write a concise, personalized connection request note (max 300 chars for LinkedIn limit) AND a follow-up message.
Return plain text in this format:

CONNECTION REQUEST (≤300 chars):
[message]

FOLLOW-UP MESSAGE (after they accept):
[message]

Rules:
- Reference the specific role and company
- Mention one specific project/skill from the candidate's profile
- Be genuine, not sales-y
- End with a soft call to action`

  const user = `CANDIDATE:
Name: ${profile.name}
Headline: ${profile.headline ?? ''}
Top skills: ${profile.skills.slice(0, 5).join(', ')}
Top project: ${profile.projects[0]?.name ?? 'N/A'} (${(profile.projects[0]?.tech ?? []).join(', ')})

TARGET:
Company: ${job.company}
Role: ${job.title}
Recruiter name: ${job.recruiterName ?? 'unknown — use "Hi" or "Hi there"'}

Write the messages.`

  return llmText(
    system,
    user,
    `CONNECTION REQUEST (≤300 chars):
Hi${job.recruiterName ? ` ${job.recruiterName}` : ''}! I saw the ${job.title} role at ${job.company} and was impressed by your work. I'm a ${profile.headline ?? 'developer'} with experience in ${profile.skills
      .slice(0, 3)
      .join(', ')}. Would love to connect and learn more.

FOLLOW-UP MESSAGE (after they accept):
Thanks for connecting! I wanted to follow up on the ${job.title} role — I recently built ${profile.projects[0]?.name ?? 'a relevant project'} using ${profile.skills
      .slice(0, 3)
      .join(', ')} that aligns well with what ${job.company} is doing. Would you be open to a quick chat this week?

(Fallback — LLM unavailable)`
  )
}
