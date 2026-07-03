import { llmJSON, llmText } from './llm'

// =====================================================
// TYPES
// =====================================================

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
  projects: any[]
  education: any[]
  experience: any[]
  achievements: string[]
  preferences: any
  jobTitles: string[]
  locations: string[]
  remoteOnly: boolean
  minSalary?: number | null
}

// =====================================================
// AGENT 1: JOB MATCHING AGENT
// Compares resume/profile with a job description and returns a match score.
// =====================================================

export async function runJobMatcher(
  profile: ProfileData,
  job: { company: string; title: string; description?: string; experience?: string; location?: string }
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
Projects: ${profile.projects.map((p) => `- ${p.name}: ${p.description ?? ''} (tech: ${(p.tech || []).join(', ')})`).join('\n')}
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

  return llmJSON<MatchResult>(
    system,
    user,
    {
      score: 60,
      missing_skills: [],
      strengths: ['MERN stack experience'],
      weaknesses: ['Limited info on JD'],
      probability_of_interview: 50,
      summary: 'Fallback match score — LLM unavailable.',
    }
  )
}

// =====================================================
// AGENT 2: RESUME BUILDER AGENT
// Generates a tailored, ATS-friendly resume for a specific job.
// =====================================================

export async function runResumeBuilder(
  profile: ProfileData,
  job: { company: string; title: string; description?: string; skills?: string[] }
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
${profile.projects.map((p) => `- ${p.name} | tech: ${(p.tech || []).join(', ')} | ${p.description ?? ''} | link: ${p.link ?? ''}`).join('\n')}
Experience:
${profile.experience.map((e) => `- ${e.role} @ ${e.company} (${e.duration ?? ''}) — ${e.description ?? ''}`).join('\n')}
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
    content: `${profile.name}\n${profile.email} | ${profile.phone ?? ''} | ${profile.location ?? ''}\n\nSUMMARY\n${profile.summary ?? profile.headline ?? ''}\n\nSKILLS\n${profile.skills.join(', ')}\n\nEXPERIENCE\n${profile.experience.map((e) => `${e.role} — ${e.company}\n${e.description ?? ''}`).join('\n\n')}\n\nPROJECTS\n${profile.projects.map((p) => `${p.name}\n${p.description ?? ''}`).join('\n\n')}\n\nEDUCATION\n${profile.education.map((e) => `${e.degree} — ${e.school} (${e.year ?? ''})`).join('\n')}\n\n(Fallback resume — LLM unavailable)`,
    tailored_summary: profile.summary ?? profile.headline ?? '',
    highlighted_projects: profile.projects.slice(0, 2).map((p) => p.name),
  })
}

// =====================================================
// AGENT 3: COVER LETTER WRITER AGENT
// =====================================================

export async function runCoverLetterWriter(
  profile: ProfileData,
  job: { company: string; title: string; description?: string }
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
Top projects: ${profile.projects.map((p) => `${p.name} (${(p.tech || []).join(', ')})`).join('; ')}

JOB:
Company: ${job.company}
Title: ${job.title}
Description: ${job.description ?? 'N/A'}

Write the cover letter.`

  return llmText(system, user, `Dear Hiring Manager at ${job.company},

I am excited to apply for the ${job.title} position at ${job.company}. With my background in ${profile.skills.slice(0, 5).join(', ')} and the projects I have built, I am confident I can contribute meaningfully to your team.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your consideration.

Sincerely,
${profile.name}`)
}

// =====================================================
// AGENT 4: SCREENING QUESTION AGENT
// Generates answers to common application screening questions.
// =====================================================

export async function runScreeningAgent(
  profile: ProfileData,
  job: { company: string; title: string; description?: string },
  customQuestions?: string[]
): Promise<ScreeningAnswer[]> {
  const questions =
    customQuestions && customQuestions.length > 0
      ? customQuestions
      : [
          'Why do you want to work at this company?',
          'Tell us about yourself.',
          'What is your greatest professional achievement?',
          'What are your salary expectations?',
          'Why are you interested in this role?',
          'Describe a challenging technical problem you solved.',
        ]

  const system = `You are a job applicant answering screening questions honestly and compellingly.
Return STRICT JSON only:
[{"question": string, "answer": string}]
Each answer should be 2-4 sentences, first-person, confident but authentic, and reference the candidate's real projects/skills where relevant.
For the salary expectations question specifically, ground the answer in the candidate's stated minimum salary if one is provided — do not invent a figure.`

  const user = `CANDIDATE:
Name: ${profile.name}
Skills: ${profile.skills.join(', ')}
Projects: ${profile.projects.map((p) => `${p.name} (${(p.tech || []).join(', ')})`).join('; ')}
Achievements: ${profile.achievements.join('; ')}
Preferences: ${JSON.stringify(profile.preferences)}
Minimum acceptable salary: ${profile.minSalary != null ? profile.minSalary : 'Not specified — give a reasonable range for the role/market instead'}

JOB at ${job.company} — ${job.title}:
${job.description ?? 'N/A'}

Answer these questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`

  const fallback: ScreeningAnswer[] = questions.map((q) => ({
    question: q,
    answer: `(Fallback answer — LLM unavailable) Based on my background in ${profile.skills.slice(0, 3).join(', ')}, I am well-suited for the ${job.title} role at ${job.company}.`,
  }))

  return llmJSON<ScreeningAnswer[]>(system, user, fallback)
}

// =====================================================
// AGENT 5: INTERVIEW PREP AGENT
// Generates prep material once an interview is scheduled.
// =====================================================

export async function runInterviewPrepAgent(
  profile: ProfileData,
  job: { company: string; title: string; description?: string }
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
Recent projects: ${profile.projects.map((p) => `${p.name} (${(p.tech || []).join(', ')})`).join('; ')}

TARGET INTERVIEW:
Company: ${job.company}
Role: ${job.title}
JD: ${job.description ?? 'N/A'}

Generate the prep plan.`

  return llmJSON<InterviewPrep>(
    system,
    user,
    {
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
      key_topics_to_review: ['React hooks', 'Node.js event loop', 'MongoDB indexing', 'REST API design', 'System design basics'],
      suggested_resources: ['MDN Web Docs', 'React official docs', 'LeetCode', 'System Design Primer on GitHub'],
    }
  )
}

// =====================================================
// AGENT 6: JOB SEARCH AGENT (REAL DATA — no LLM synthesis)
//
// Pulls actual live postings from free, keyless public job-board APIs:
//   - Remotive   (remotive.com)   — remote tech roles, searchable by title
//   - RemoteOK   (remoteok.com)   — remote tech roles, tagged by skill
//   - Arbeitnow  (arbeitnow.com)  — general board, EU/remote leaning
//
// KNOWN GAP: none of these index Nepal-specific on-site boards
// (Merojob, Kumarijob, JobAxle, etc.) because those don't expose a
// public API. If you need on-site Kathmandu listings, that requires
// a dedicated scraper against a specific site — tell me which one
// and I'll check its terms/robots.txt and build it as a separate,
// clearly-labeled source rather than folding it in silently here.
//
// Requires Node 18+ (global fetch) or a fetch polyfill.
// =====================================================

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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchRemotive(query: string): Promise<SeedJob[]> {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || []).map((j: any) => ({
      company: j.company_name,
      title: j.title,
      salary: j.salary || undefined,
      experience: undefined,
      location: j.candidate_required_location || 'Remote',
      remote: true,
      url: j.url,
      deadline: undefined,
      description: stripHtml(j.description || '').slice(0, 1200),
      skills: j.tags || [],
      source: 'remotive',
    }))
  } catch (err) {
    console.warn('[jobSearch] Remotive fetch failed:', err)
    return []
  }
}

async function fetchRemoteOK(): Promise<SeedJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobSearchAgent/1.0)' },
    })
    if (!res.ok) return []
    const data = await res.json()
    const jobs = Array.isArray(data) ? data.slice(1) : [] // index 0 is a legal-notice object, not a job
    return jobs.map((j: any) => ({
      company: j.company,
      title: j.position,
      salary: j.salary_min && j.salary_max ? `$${j.salary_min} - $${j.salary_max} / year` : undefined,
      experience: undefined,
      location: j.location || 'Remote',
      remote: true,
      url: j.url || (j.id ? `https://remoteok.com/remote-jobs/${j.id}` : undefined),
      deadline: undefined,
      description: stripHtml(j.description || '').slice(0, 1200),
      skills: j.tags || [],
      source: 'remoteok',
    }))
  } catch (err) {
    console.warn('[jobSearch] RemoteOK fetch failed:', err)
    return []
  }
}

async function fetchArbeitnow(): Promise<SeedJob[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api')
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map((j: any) => ({
      company: j.company_name,
      title: j.title,
      salary: undefined,
      experience: undefined,
      location: j.location || (j.remote ? 'Remote' : 'Not specified'),
      remote: !!j.remote,
      url: j.url,
      deadline: undefined,
      description: stripHtml(j.description || '').slice(0, 1200),
      skills: j.tags || [],
      source: 'arbeitnow',
    }))
  } catch (err) {
    console.warn('[jobSearch] Arbeitnow fetch failed:', err)
    return []
  }
}

/** Simple relevance score against the candidate's profile — no LLM call needed. */
function scoreJobRelevance(job: SeedJob, profile: ProfileData): number {
  const haystack = `${job.title} ${job.skills.join(' ')} ${job.description}`.toLowerCase()
  let score = 0

  for (const skill of profile.skills) {
    if (skill && haystack.includes(skill.toLowerCase())) score += 2
  }
  for (const title of profile.jobTitles) {
    if (title && job.title.toLowerCase().includes(title.toLowerCase())) score += 5
  }
  if (profile.remoteOnly && job.remote) score += 3
  if (profile.locations.some((loc) => loc && job.location && job.location.toLowerCase().includes(loc.split(',')[0].toLowerCase()))) {
    score += 2
  }
  return score
}

export async function runJobSearchAgent(profile: ProfileData): Promise<SeedJob[]> {
  const titles =
    profile.jobTitles.length > 0
      ? profile.jobTitles
      : ['MERN Developer', 'React Developer', 'Node.js Developer', 'Software Engineer']

  // Remotive supports per-title search; RemoteOK and Arbeitnow return their
  // full current feed and get filtered/scored client-side.
  const [remotiveResults, remoteOKResults, arbeitnowResults] = await Promise.all([
    Promise.all(titles.slice(0, 4).map(fetchRemotive)).then((arr) => arr.flat()),
    fetchRemoteOK(),
    fetchArbeitnow(),
  ])

  const all = [...remotiveResults, ...remoteOKResults, ...arbeitnowResults]

  // De-dupe by posting URL
  const seen = new Set<string>()
  const deduped = all.filter((j) => {
    if (!j.url || seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })

  const ranked = deduped
    .map((job) => ({ job, score: scoreJobRelevance(job, profile) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.job)

  if (ranked.length === 0) {
    console.warn(
      '[jobSearch] No real listings matched this profile. Sources may be temporarily unreachable, ' +
        'or the profile skills/titles are too narrow — try broadening jobTitles.'
    )
  }

  return ranked.slice(0, 20)
}