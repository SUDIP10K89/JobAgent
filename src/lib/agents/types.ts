/**
 * Shared types used across all agents.
 */

export interface ProfileData {
  name: string
  email: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  portfolio?: string
  headline?: string
  summary?: string
  skills: string[]
  projects: {
    name: string
    tech: string[]
    description?: string
    link?: string
  }[]
  education: {
    degree: string
    school: string
    year?: string
  }[]
  experience: {
    role: string
    company: string
    duration?: string
    description?: string
  }[]
  achievements: string[]
  preferences: Record<string, any>
  jobTitles: string[]
  locations: string[]
  remoteOnly: boolean
  minSalary?: number | null
}

export interface JobContext {
  company: string
  title: string
  description?: string
  experience?: string
  location?: string
  skills?: string[]
  recruiterName?: string
}

export interface MatchResult {
  score: number
  missing_skills: string[]
  strengths: string[]
  weaknesses: string[]
  probability_of_interview: number
  summary: string
}

export interface GeneratedResume {
  content: string
  tailored_summary: string
  highlighted_projects: string[]
}

export interface ScreeningAnswer {
  question: string
  answer: string
}

export interface InterviewPrep {
  company_overview: string
  top_technical_questions: string[]
  top_coding_questions: string[]
  behavioral_questions: string[]
  key_topics_to_review: string[]
  suggested_resources: string[]
}

export interface ATSScore {
  score: number
  issues: { severity: 'high' | 'medium' | 'low'; issue: string; fix: string }[]
  keyword_coverage: number
  format_score: number
  recommendations: string[]
}

export interface SeedJob {
  company: string
  title: string
  salary?: string
  experience?: string
  location?: string
  remote: boolean
  url?: string
  deadline?: string
  description: string
  skills: string[]
  source: string
}
