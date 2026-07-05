/**
 * Agent 1: Job Search Agent
 *
 * In production this would scrape LinkedIn / Indeed / Glassdoor / Wellfound / RemoteOK / YC.
 * Real scraping lives in src/lib/job-fetchers.ts.
 *
 * This module is the LLM-synthesized fallback used when real sources return nothing,
 * or when explicitly requested by the user.
 */

import { llmJSON } from '../llm'
import type { ProfileData, SeedJob } from './types'

export async function runJobSearchAgent(profile: ProfileData): Promise<SeedJob[]> {
  const titles =
    profile.jobTitles.length > 0
      ? profile.jobTitles
      : ['MERN Developer', 'React Developer', 'Node.js Developer', 'Software Engineer']
  const locs =
    profile.locations.length > 0 ? profile.locations : ['Kathmandu, Nepal', 'Remote']

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
      description:
        'We are looking for a MERN stack developer to build and scale web applications for global clients. You will work with React, Node.js, Express, and MongoDB in an agile team. Strong fundamentals in JavaScript and REST API design required.',
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
      description:
        'CloudFactory is hiring junior software engineers to support our growing team. You will build internal tools using JavaScript, React, and Node.js. Great opportunity for fresh graduates.',
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
      description:
        'Join F1Soft to build fintech products used by millions. We need a React developer with strong UI/UX sensibility and experience with state management libraries like Redux or Zustand.',
      skills: ['React', 'Redux', 'TypeScript', 'Tailwind CSS', 'REST API'],
      source: 'indeed',
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
      description:
        'Toptal is looking for top React developers to join our network of elite freelancers. Work on diverse projects with global clients. Must have strong English communication skills.',
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
      description:
        'Early-stage YC-backed startup hiring a full-stack MERN engineer. You will own features end-to-end. High impact, high autonomy, fast pace.',
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
      description:
        'Brainstem Technologies is offering a 3-month internship for fresh graduates. You will learn React, Node.js, and MongoDB while building real products. High chance of full-time conversion.',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
      source: 'wellfound',
    },
  ]
}
