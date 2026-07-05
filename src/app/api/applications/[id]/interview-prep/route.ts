import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runInterviewPrepAgent } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const app = await db.application.findFirst({
      where: { id, job: { userId: session.user.id } },
      include: { job: true },
    })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const profile = toProfileData(await getOrCreateProfileForUser(session.user))
    const prep = await runInterviewPrepAgent(profile, {
      company: app.job.company,
      title: app.job.title,
      description: app.job.description ?? undefined,
    })

    const updated = await db.application.update({
      where: { id },
      data: { interviewPrep: JSON.stringify(prep), status: 'technical' },
    })

    return NextResponse.json({ prep, application: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
