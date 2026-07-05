import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runFollowUpGenerator } from '@/lib/agents'

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
    const daysSinceApplied = app.appliedAt
      ? Math.floor((Date.now() - app.appliedAt.getTime()) / 86400000)
      : 7

    const message = await runFollowUpGenerator(
      profile,
      {
        company: app.job.company,
        title: app.job.title,
        applicationDate: app.appliedAt?.toISOString(),
      },
      daysSinceApplied
    )

    const updated = await db.application.update({
      where: { id },
      data: {
        lastContactAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 14 * 86400000),
        followUpCount: { increment: 1 },
      },
    })

    await db.notification.updateMany({
      where: { applicationId: id, type: 'follow_up_reminder', read: false },
      data: { read: true },
    })

    return NextResponse.json({ message, application: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
