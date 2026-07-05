import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireAuth()
    const profile = await getOrCreateProfileForUser(session.user)
    return NextResponse.json({ profile: toProfileData(profile), raw: profile })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const profile = await getOrCreateProfileForUser(session.user)

    const updated = await db.profile.update({
      where: { id: profile.id },
      data: {
        name: body.name ?? profile.name,
        email: body.email ?? profile.email,
        phone: body.phone ?? profile.phone,
        location: body.location ?? profile.location,
        linkedin: body.linkedin ?? profile.linkedin,
        github: body.github ?? profile.github,
        portfolio: body.portfolio ?? profile.portfolio,
        headline: body.headline ?? profile.headline,
        summary: body.summary ?? profile.summary,
        skills: JSON.stringify(body.skills ?? JSON.parse(profile.skills)),
        projects: JSON.stringify(body.projects ?? JSON.parse(profile.projects)),
        education: JSON.stringify(body.education ?? JSON.parse(profile.education)),
        experience: JSON.stringify(body.experience ?? JSON.parse(profile.experience)),
        achievements: JSON.stringify(body.achievements ?? JSON.parse(profile.achievements)),
        preferences: JSON.stringify(body.preferences ?? JSON.parse(profile.preferences)),
        jobTitles: JSON.stringify(body.jobTitles ?? JSON.parse(profile.jobTitles)),
        locations: JSON.stringify(body.locations ?? JSON.parse(profile.locations)),
        remoteOnly: body.remoteOnly ?? profile.remoteOnly,
        minSalary: body.minSalary ?? profile.minSalary,
      },
    })

    return NextResponse.json({ profile: toProfileData(updated), raw: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
