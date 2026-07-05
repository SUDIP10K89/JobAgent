/**
 * Agent 9: Interview Prep Agent
 *
 * Generates a focused interview prep plan once an interview is scheduled:
 * company overview, technical/coding/behavioral questions, key topics,
 * and suggested resources.
 */

import { llmJSON } from '../llm'
import type { ProfileData, JobContext, InterviewPrep } from './types'

export async function runInterviewPrepAgent(
  profile: ProfileData,
  job: JobContext
): Promise<InterviewPrep> {
  const system = `You are a senior engineering interview coach.
Given the candidate's profile and the target job, produce a focused interview prep plan.
Return STRICT JSON only:
{
  "company_overview": string (2-3 sentences),
  "top_technical_questions": string[] (5-7 likely technical questions),
  "top_coding_questions": string[] (4-6 likely coding/system design questions),
  "behavioral_questions": string[] (4-6 behavioral questions),
  "key_topics_to_review": string[] (4-6 concepts to brush up),
  "suggested_resources": string[] (3-5 docs/links/practice sites)
}`

  const user = `CANDIDATE:
Skills: ${profile.skills.join(', ')}
Recent projects: ${profile.projects
    .map((p) => `${p.name} (${(p.tech || []).join(', ')})`)
    .join('; ')}

TARGET INTERVIEW:
Company: ${job.company}
Role: ${job.title}
JD: ${job.description ?? 'N/A'}

Generate the prep plan.`

  return llmJSON<InterviewPrep>(system, user, {
    company_overview: `${job.company} is hiring for the ${job.title} role.`,
    top_technical_questions: [
      'Explain the React component lifecycle.',
      'How does Node.js handle async I/O?',
      'What is the difference between SQL and NoSQL databases?',
      'Explain REST vs GraphQL.',
      'How do you manage state in a large React app?',
    ],
    top_coding_questions: [
      'Reverse a linked list.',
      'Implement a debounce function.',
      'Two-sum problem.',
      'Design a URL shortener.',
    ],
    behavioral_questions: [
      'Tell me about a time you faced a tough bug.',
      'Describe a conflict with a teammate.',
      'Tell me about a project you are proud of.',
      'How do you handle tight deadlines?',
    ],
    key_topics_to_review: [
      'React hooks',
      'Node.js event loop',
      'MongoDB indexing',
      'REST API design',
      'System design basics',
    ],
    suggested_resources: [
      'MDN Web Docs',
      'React official docs',
      'LeetCode',
      'System Design Primer on GitHub',
    ],
  })
}
