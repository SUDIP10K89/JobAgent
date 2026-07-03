import { db } from './db'
import type { ProfileData } from './agents'

export function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function toProfileData(p: any): ProfileData {
  return {
    name: p.name ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    location: p.location ?? '',
    linkedin: p.linkedin ?? '',
    github: p.github ?? '',
    portfolio: p.portfolio ?? '',
    headline: p.headline ?? '',
    summary: p.summary ?? '',
    skills: parseJSON<string[]>(p.skills, []),
    projects: parseJSON<any[]>(p.projects, []),
    education: parseJSON<any[]>(p.education, []),
    experience: parseJSON<any[]>(p.experience, []),
    achievements: parseJSON<string[]>(p.achievements, []),
    preferences: parseJSON<any>(p.preferences, {}),
    jobTitles: parseJSON<string[]>(p.jobTitles, []),
    locations: parseJSON<string[]>(p.locations, []),
    remoteOnly: p.remoteOnly ?? false,
    minSalary: p.minSalary ?? null,
  }
}

export async function getOrCreateProfile(): Promise<any> {
  let profile = await db.profile.findFirst()
  if (!profile) {
    profile = await db.profile.create({
      data: {
        name: 'Sudip Tamang',
        email: 'sudip@example.com',
        phone: '+977-98XXXXXXXX',
        location: 'Kathmandu, Nepal',
        linkedin: 'https://linkedin.com/in/sudip',
        github: 'https://github.com/sudip',
        portfolio: 'https://sudip.dev',
        headline: 'MERN Stack Developer',
        summary:
          'Full-stack JavaScript developer with hands-on experience building production web apps with React, Node.js, Express, and MongoDB. Passionate about clean UI, scalable APIs, and learning new tools.',
        skills: JSON.stringify([
          'React',
          'Node.js',
          'Express',
          'MongoDB',
          'TypeScript',
          'JavaScript',
          'Tailwind CSS',
          'REST API',
          'Git',
          'PostgreSQL',
          'Next.js',
          'Docker',
        ]),
        projects: JSON.stringify([
          {
            name: 'Spotify AI Companion',
            tech: ['React', 'Node.js', 'Express', 'MongoDB', 'OpenAI API'],
            description:
              'A web app that uses OpenAI to generate playlist recommendations based on mood and listening history. Includes OAuth, real-time player, and a recommendation engine.',
            link: 'https://github.com/sudip/spotify-ai',
          },
          {
            name: 'Complaint Management System',
            tech: ['React', 'Node.js', 'Express', 'PostgreSQL', 'JWT'],
            description:
              'A multi-tenant complaint system for municipalities. Supports role-based auth, ticket assignment, SLA tracking, and analytics dashboards.',
            link: 'https://github.com/sudip/complaint-system',
          },
          {
            name: 'AI Chatbot for Education',
            tech: ['Next.js', 'Node.js', 'MongoDB', 'OpenAI API', 'WebSocket'],
            description:
              'A real-time chatbot that answers student queries about courses and admissions. Uses RAG with course catalogs and streams responses via WebSocket.',
            link: 'https://github.com/sudip/edu-chatbot',
          },
          {
            name: 'Social Network Graph Analyzer',
            tech: ['React', 'D3.js', 'Node.js', 'Neo4j'],
            description:
              'Visualizes and analyzes social network graphs to detect communities, influencers, and information flow patterns using graph algorithms.',
            link: 'https://github.com/sudip/network-analysis',
          },
        ]),
        education: JSON.stringify([
          {
            degree: 'BSc. Computer Science and Information Technology',
            school: 'Tribhuvan University',
            year: '2024',
          },
        ]),
        experience: JSON.stringify([
          {
            role: 'Freelance Full-Stack Developer',
            company: 'Self-employed',
            duration: '2023 - Present',
            description:
              'Built and deployed 5+ MERN web apps for local clients. Handled everything from requirements to deployment.',
          },
          {
            role: 'Frontend Developer Intern',
            company: 'Local Startup',
            duration: '3 months, 2023',
            description:
              'Worked on React components, integrated REST APIs, and improved page load performance by 40%.',
          },
        ]),
        achievements: JSON.stringify([
          'Winner — Hackathon Nepal 2023 (Best Use of AI)',
          'Top 5 — Ncell App Challenge',
          'Open-source contributor (50+ GitHub stars)',
        ]),
        preferences: JSON.stringify({
          workMode: 'hybrid',
          noticePeriod: '15 days',
          availableFrom: '2026-08-01',
        }),
        jobTitles: JSON.stringify([
          'MERN Developer',
          'React Developer',
          'Node.js Developer',
          'Software Engineer',
        ]),
        locations: JSON.stringify(['Kathmandu, Nepal', 'Remote']),
        remoteOnly: false,
        minSalary: 60000,
      },
    })
  }
  return profile
}

export async function ensureSeedJobs(): Promise<void> {
  const count = await db.job.count()
  if (count > 0) return

  const fallbackJobs = [
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
    },
  ]

  for (const j of fallbackJobs) {
    await db.job.create({
      data: { ...j, source: 'linkedin' },
    })
  }
}

// Seed a few sample applications for the dashboard to feel alive
export async function ensureSeedApplications(): Promise<void> {
  const count = await db.application.count()
  if (count > 0) return

  const jobs = await db.job.findMany({ take: 3 })
  const statuses = ['applied', 'viewed', 'hr_contact', 'rejected']
  for (let i = 0; i < jobs.length; i++) {
    await db.application.create({
      data: {
        jobId: jobs[i].id,
        status: statuses[i] ?? 'applied',
        appliedAt: new Date(Date.now() - (i + 1) * 86400000 * 2),
        resumeContent: `(Tailored resume for ${jobs[i].title} @ ${jobs[i].company})`,
        coverLetter: `(Cover letter for ${jobs[i].company})`,
      },
    })
  }
}
