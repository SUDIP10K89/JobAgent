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

export interface MatchResult {
  score: number
  missing_skills: string[]
  strengths: string[]
  weaknesses: string[]
  probability_of_interview: number
  summary: string
}

export interface Job {
  id: string
  source: string
  company: string
  title: string
  salary: string | null
  experience: string | null
  location: string | null
  remote: boolean
  url: string | null
  deadline: string | null
  description: string | null
  tags: string | null
  matchScore: number | null
  matchResult: string | null
  atsScore: number | null
  atsResult: string | null
  status: string
  createdAt: string
  updatedAt: string
  applications?: Application[]
}

export interface Application {
  id: string
  jobId: string
  job?: Job
  status: string
  appliedAt: string | null
  lastContactAt: string | null
  nextFollowUpAt: string | null
  followUpCount: number
  resumeContent: string | null
  coverLetter: string | null
  screeningQA: string | null
  interviewPrep: string | null
  networkingMsg: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardData {
  totalJobs: number
  totalApplications: number
  avgMatch: number
  statusCounts: Record<string, number>
  funnel: { stage: string; count: number }[]
  matchBuckets: { range: string; count: number }[]
  recentApplications: (Application & { job: Job })[]
  topMatches: Job[]
}

export const APP_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'applied', label: 'Applied', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'viewed', label: 'Viewed', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { value: 'hr_contact', label: 'HR Contact', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { value: 'technical', label: 'Technical', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { value: 'offer', label: 'Offer', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
] as const

export function getStatusInfo(status: string) {
  return APP_STATUSES.find((s) => s.value === status) ?? APP_STATUSES[0]
}

export function getMatchColor(score: number | null) {
  if (score === null) return { text: 'text-zinc-400', bg: 'bg-zinc-500/10', ring: 'ring-zinc-500/20' }
  if (score >= 85) return { text: 'text-emerald-300', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/30' }
  if (score >= 70) return { text: 'text-teal-300', bg: 'bg-teal-500/15', ring: 'ring-teal-500/30' }
  if (score >= 55) return { text: 'text-amber-300', bg: 'bg-amber-500/15', ring: 'ring-amber-500/30' }
  return { text: 'text-rose-300', bg: 'bg-rose-500/15', ring: 'ring-rose-500/30' }
}

export function sourceBadge(source: string) {
  const map: Record<string, { label: string; color: string }> = {
    linkedin: { label: 'LinkedIn', color: 'text-cyan-300 bg-cyan-500/10' },
    indeed: { label: 'Indeed', color: 'text-violet-300 bg-violet-500/10' },
    glassdoor: { label: 'Glassdoor', color: 'text-emerald-300 bg-emerald-500/10' },
    wellfound: { label: 'Wellfound', color: 'text-amber-300 bg-amber-500/10' },
    remoteok: { label: 'RemoteOK', color: 'text-teal-300 bg-teal-500/10' },
    ycombinator: { label: 'YC Jobs', color: 'text-orange-300 bg-orange-500/10' },
    arbeitnow: { label: 'Arbeitnow', color: 'text-cyan-300 bg-cyan-500/10' },
    hn: { label: 'HN', color: 'text-amber-300 bg-amber-500/10' },
    manual: { label: 'Manual', color: 'text-zinc-300 bg-zinc-500/10' },
  }
  return map[source] ?? { label: source, color: 'text-zinc-300 bg-zinc-500/10' }
}

export function parseMatchResult(json: string | null): MatchResult | null {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function parseScreeningQA(json: string | null): { question: string; answer: string }[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

export function parseInterviewPrep(json: string | null) {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}
