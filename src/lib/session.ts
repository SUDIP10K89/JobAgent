import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { db } from './db'
import type { ProfileData } from './agents/types'

export interface AuthSession {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

/**
 * Get the current authenticated session, or null.
 */
export async function getSession(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return session as AuthSession
}

/**
 * Require authentication — throws 401 if not authenticated.
 * Returns the session user.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

/**
 * Get or create a Profile for the logged-in user.
 * Seeds a default profile on first login.
 */
export async function getOrCreateProfileForUser(user: {
  id: string
  name?: string | null
  email: string
}) {
  let profile = await db.profile.findUnique({
    where: { userId: user.id },
  })

  if (!profile) {
    const name = user.name || user.email.split('@')[0]
    profile = await db.profile.create({
      data: {
        userId: user.id,
        name,
        email: user.email,
        headline: 'Software Developer',
        summary:
          'Full-stack developer looking for new opportunities. Passionate about clean code, scalable APIs, and learning new tools.',
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
        ]),
        projects: JSON.stringify([]),
        education: JSON.stringify([]),
        experience: JSON.stringify([]),
        achievements: JSON.stringify([]),
        preferences: JSON.stringify({}),
        jobTitles: JSON.stringify([
          'MERN Developer',
          'React Developer',
          'Node.js Developer',
          'Software Engineer',
        ]),
        locations: JSON.stringify(['Remote']),
        remoteOnly: false,
      },
    })
  }

  return profile
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

function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
