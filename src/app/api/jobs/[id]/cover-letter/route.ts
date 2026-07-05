import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runCoverLetterWriter } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const job = await db.job.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const profile = toProfileData(await getOrCreateProfileForUser(session.user))
    const coverLetter = await runCoverLetterWriter(profile, {
      company: job.company,
      title: job.title,
      description: job.description ?? undefined,
    })

    const app = await db.application.upsert({
      where: { jobId: job.id },
      update: { coverLetter },
      create: { jobId: job.id, status: 'draft', coverLetter },
    })

    return NextResponse.json({ coverLetter, applicationId: app.id })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
