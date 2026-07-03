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
Each answer should be 2-4 sentences, first-person, confident but authentic, and reference the candidate's real projects/skills where relevant.`

  const user = `CANDIDATE:
Name: ${profile.name}
Skills: ${profile.skills.join(', ')}
Projects: ${profile.projects.map((p) => `${p.name} (${(p.tech || []).join(', ')})`).join('; ')}
Achievements: ${profile.achievements.join('; ')}
Preferences: ${JSON.stringify(profile.preferences)}

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
// AGENT 6: JOB SEARCH AGENT (simulated)
// In production this would scrape LinkedIn/Indeed/etc.
// Here we use the LLM to synthesize realistic job listings based on the user's preferences.
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

export async function runJobSearchAgent(profile: ProfileData): Promise<SeedJob[]> {
  const titles = profile.jobTitles.length > 0 ? profile.jobTitles : ['MERN Developer', 'React Developer', 'Node.js Developer', 'Software Engineer']
  const locs = profile.locations.length > 0 ? profile.locations : ['Kathmandu, Nepal', 'Remote']

  const system = `You are a job search engine. Generate 6-8 REALISTIC job listings for the candidate.
Each listing should look like a real posting from companies that hire MERN/React/Node developers in Nepal and remote.
Vary companies, titles, and salary ranges. Mix of remote and on-site.
Return STRICT JSON only — an array of objects:
[{
  "company": string,
  "title": string,
  "salary": string (e.g. "NPR 80,000 - 120,000 / month" or "$60,000 - $90,000 / year"),
  "experience": string (e.g. "0-2 years", "3+ years"),
  "location": string,
  "remote": boolean,
  "url": string (use https://example.com/jobs/<slug>),
  "deadline": string (YYYY-MM-DD),
  "description": string (3-5 sentence JD),
  "skills": string[] (5-8 required skills),
  "source": string (one of: linkedin, indeed, glassdoor, wellfound, remoteok, ycombinator)
}]`

  const user = `Candidate is looking for:
Titles: ${titles.join(', ')}
Locations: ${locs.join(', ')}
Remote only: ${profile.remoteOnly}
Min salary: ${profile.minSalary ?? 'Not specified'}
Top skills: ${profile.skills.slice(0, 10).join(', ')}

Generate realistic job listings now.`

  return llmJSON<SeedJob[]>(system, user, getFallbackJobs())
}

function getFallbackJobs(): SeedJob[] {
  return [
    {
      company: 'Leapfrog Technology',
      title: 'MERN Stack Developer',
      salary: 'NPR 80,000 - 150,000 / month',
      experience: '1-3 years',
      location: 'Kathmandu, Nepal',
      remote: false,
      url: 'https://example.com/jobs/leapfrog-mern',
      deadline: '2026-07-20',
      description: 'We are looking for a MERN stack developer to build and scale web applications for global clients. You will work with React, Node.js, Express, and MongoDB in an agile team. Strong fundamentals in JavaScript and REST API design required.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'REST API'],
      source: 'linkedin',
    },
    {
      company: 'CloudFactory',
      title: 'Junior Software Engineer',
      salary: 'NPR 50,000 - 80,000 / month',
      experience: '0-2 years',
      location: 'Kathmandu, Nepal',
      remote: false,
      url: 'https://example.com/jobs/cloudfactory-junior',
      deadline: '2026-07-25',
      description: 'CloudFactory is hiring junior software engineers to support our growing team. You will build internal tools using JavaScript, React, and Node.js. Great opportunity for fresh graduates.',
      skills: ['JavaScript', 'React', 'Node.js', 'Git', 'SQL'],
      source: 'linkedin',
    },
    {
      company: 'F1Soft International',
      title: 'React Developer',
      salary: 'NPR 70,000 - 120,000 / month',
      experience: '2+ years',
      location: 'Lalitpur, Nepal',
      remote: false,
      url: 'https://example.com/jobs/f1soft-react',
      deadline: '2026-07-30',
      description: 'Join F1Soft to build fintech products used by millions. We need a React developer with strong UI/UX sensibility and experience with state management libraries like Redux or Zustand.',
      skills: ['React', 'Redux', 'TypeScript', 'Tailwind CSS', 'REST API'],
      source: 'indeed',
    },
    {
      company: 'Vairav Technology',
      title: 'Node.js Backend Developer',
      salary: 'NPR 90,000 - 140,000 / month',
      experience: '2-4 years',
      location: 'Kathmandu, Nepal',
      remote: false,
      url: 'https://example.com/jobs/vairav-node',
      deadline: '2026-08-05',
      description: 'We are hiring a Node.js backend developer to design scalable APIs and microservices. Experience with PostgreSQL, Redis, and Docker is a plus.',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker', 'REST API'],
      source: 'glassdoor',
    },
    {
      company: 'Toptal',
      title: 'Remote React Developer',
      salary: '$40,000 - $70,000 / year',
      experience: '3+ years',
      location: 'Remote (Worldwide)',
      remote: true,
      url: 'https://example.com/jobs/toptal-react',
      deadline: '2026-07-31',
      description: 'Toptal is looking for top React developers to join our network of elite freelancers. Work on diverse projects with global clients. Must have strong English communication skills.',
      skills: ['React', 'TypeScript', 'GraphQL', 'Webpack', 'Jest', 'CI/CD'],
      source: 'remoteok',
    },
    {
      company: 'Y Combinator Startup',
      title: 'Full Stack Engineer (MERN)',
      salary: '$60,000 - $100,000 / year + equity',
      experience: '2+ years',
      location: 'Remote',
      remote: true,
      url: 'https://example.com/jobs/yc-fullstack',
      deadline: '2026-08-15',
      description: 'Early-stage YC-backed startup hiring a full-stack MERN engineer. You will own features end-to-end. High impact, high autonomy, fast pace.',
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'AWS', 'Next.js'],
      source: 'ycombinator',
    },
    {
      company: 'Brainstem Technologies',
      title: 'Software Engineer Intern',
      salary: 'NPR 25,000 - 40,000 / month',
      experience: '0-1 years',
      location: 'Kathmandu, Nepal',
      remote: false,
      url: 'https://example.com/jobs/brainstem-intern',
      deadline: '2026-07-18',
      description: 'Brainstem Technologies is offering a 3-month internship for fresh graduates. You will learn React, Node.js, and MongoDB while building real products. High chance of full-time conversion.',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
      source: 'wellfound',
    },
    {
      company: 'Naamche',
      title: 'Senior Frontend Engineer',
      salary: 'NPR 150,000 - 250,000 / month',
      experience: '4+ years',
      location: 'Remote (Nepal)',
      remote: true,
      url: 'https://example.com/jobs/naamche-frontend',
      deadline: '2026-08-10',
      description: 'Naamche is hiring a senior frontend engineer to lead React-based product development. You will mentor juniors and drive architecture decisions.',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'System Design', 'Leadership'],
      source: 'linkedin',
    },
  ]
}
