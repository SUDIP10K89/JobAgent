/**
 * Agent 3: Resume Builder Agent
 *
 * Generates a tailored, ATS-friendly resume for a specific job.
 * Moves the most relevant projects to the top, rewrites the summary,
 * and emphasizes matching skills.
 */

import { llmJSON } from '../llm'
import type { ProfileData, JobContext, GeneratedResume } from './types'

export async function runResumeBuilder(
  profile: ProfileData,
  job: JobContext
): Promise<GeneratedResume> {
  const system = `You are an expert resume writer specialized in software engineering roles.
Generate a tailored, ATS-friendly resume for the specific job.
- Move the most relevant projects and experience to the top.
- Customize the professional summary to match the job's required skills.
- Quantify achievements where possible.
- Use clean section headers: SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION.
- Plain text format (no markdown), max 1 page.
Return STRICT JSON only:
{
  "content": string (the full resume text),
  "tailored_summary": string (the 2-3 line professional summary you wrote),
  "highlighted_projects": string[] (project names that were emphasized)
}`

  const user = `CANDIDATE MASTER PROFILE:
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone ?? ''}
Location: ${profile.location ?? ''}
LinkedIn: ${profile.linkedin ?? ''}
GitHub: ${profile.github ?? ''}
Portfolio: ${profile.portfolio ?? ''}
Headline: ${profile.headline ?? ''}
Summary: ${profile.summary ?? ''}
Skills: ${profile.skills.join(', ')}
Projects:
${profile.projects
    .map(
      (p) =>
        `- ${p.name} | tech: ${(p.tech || []).join(', ')} | ${p.description ?? ''} | link: ${p.link ?? ''}`
    )
    .join('\n')}
Experience:
${profile.experience
    .map((e) => `- ${e.role} @ ${e.company} (${e.duration ?? ''}) — ${e.description ?? ''}`)
    .join('\n')}
Education:
${profile.education.map((e) => `- ${e.degree} @ ${e.school} (${e.year ?? ''})`).join('\n')}
Achievements:
${profile.achievements.join('\n')}

TARGET JOB:
Company: ${job.company}
Title: ${job.title}
Required skills (from JD): ${(job.skills ?? []).join(', ') || 'see description'}
Job description:
${job.description ?? 'N/A'}

Write the tailored resume now.`

  return llmJSON<GeneratedResume>(system, user, {
    content: `${profile.name}\n${profile.email} | ${profile.phone ?? ''} | ${profile.location ?? ''}\n\nSUMMARY\n${profile.summary ?? profile.headline ?? ''}\n\nSKILLS\n${profile.skills.join(', ')}\n\nEXPERIENCE\n${profile.experience
      .map((e) => `${e.role} — ${e.company}\n${e.description ?? ''}`)
      .join('\n\n')}\n\nPROJECTS\n${profile.projects
      .map((p) => `${p.name}\n${p.description ?? ''}`)
      .join('\n\n')}\n\nEDUCATION\n${profile.education
      .map((e) => `${e.degree} — ${e.school} (${e.year ?? ''})`)
      .join('\n')}\n\n(Fallback resume — LLM unavailable)`,
    tailored_summary: profile.summary ?? profile.headline ?? '',
    highlighted_projects: profile.projects.slice(0, 2).map((p) => p.name),
  })
}
