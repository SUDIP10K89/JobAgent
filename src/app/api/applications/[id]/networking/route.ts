import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runNetworkingMessageGenerator } from '@/lib/agents'

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

    let recruiterName: string | undefined
    try {
      const body = await req.json()
      recruiterName = body?.recruiterName
    } catch {}

    const message = await runNetworkingMessageGenerator(profile, {
      company: app.job.company,
      title: app.job.title,
      description: app.job.description ?? undefined,
      recruiterName,
    })

    const updated = await db.application.update({
      where: { id },
      data: { networkingMsg: message },
    })

    return NextResponse.json({ message, application: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
