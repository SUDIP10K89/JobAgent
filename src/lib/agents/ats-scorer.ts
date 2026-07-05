/**
 * Agent 11: ATS Scoring Agent
 *
 * Scores a resume against ATS (Applicant Tracking System) best practices
 * — checks keyword coverage, formatting, and identifies issues with fixes.
 */

import { llmJSON } from '../llm'
import type { ATSScore } from './types'

export async function runATSScoring(
  resumeText: string,
  jobDescription: string
): Promise<ATSScore> {
  const system = `You are an ATS (Applicant Tracking System) optimization expert.
Analyze the resume against the job description for ATS compatibility.
Return STRICT JSON only:
{
  "score": number (0-100),
  "issues": [{"severity": "high" | "medium" | "low", "issue": string, "fix": string}],
  "keyword_coverage": number (0-100, % of JD keywords found in resume),
  "format_score": number (0-100, formatting/structure quality),
  "recommendations": string[] (3-5 actionable improvements)
}
Common ATS issues to check: missing keywords, generic summary, no quantified achievements, missing contact info, employment gaps unexplained, irrelevant sections, complex formatting.`

  const user = `RESUME:
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

Score the resume for ATS compatibility.`

  return llmJSON<ATSScore>(system, user, {
    score: 70,
    issues: [
      {
        severity: 'medium',
        issue: 'Unable to perform deep ATS analysis (LLM unavailable)',
        fix: 'Review manually for keyword coverage and quantified achievements',
      },
    ],
    keyword_coverage: 65,
    format_score: 75,
    recommendations: [
      'Add more keywords from the job description',
      'Quantify achievements with numbers (%, $, time saved)',
      'Ensure contact info is at the top',
    ],
  })
}
