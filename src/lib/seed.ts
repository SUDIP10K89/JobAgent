import { db } from './db'

/**
 * Seed sample jobs for a user on first visit to the Job Feed.
 * Only runs if the user has zero jobs.
 */
export async function ensureSeedJobs(userId: string): Promise<void> {
  const count = await db.job.count({ where: { userId } })
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
      data: { ...j, source: 'linkedin', userId },
    })
  }
}
