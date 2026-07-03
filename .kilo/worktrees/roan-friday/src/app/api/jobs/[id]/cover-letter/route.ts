import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, toProfileData } from '@/lib/seed'
import { runCoverLetterWriter } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const profile = toProfileData(await getOrCreateProfile())
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
}
