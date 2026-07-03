import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, toProfileData } from '@/lib/seed'
import { runResumeBuilder } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const profile = toProfileData(await getOrCreateProfile())
  const resume = await runResumeBuilder(profile, {
    company: job.company,
    title: job.title,
    description: job.description ?? undefined,
  })

  // upsert application draft
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
}
