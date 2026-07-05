import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runResumeBuilder } from '@/lib/agents'

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
    const resume = await runResumeBuilder(profile, {
      company: job.company,
      title: job.title,
      description: job.description ?? undefined,
    })

    const app = await db.application.upsert({
      where: { jobId: job.id },
      update: { resumeContent: resume.content },
      create: {
        jobId: job.id,
        status: 'draft',
        resumeContent: resume.content,
      },
    })

    return NextResponse.json({ resume, applicationId: app.id })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
