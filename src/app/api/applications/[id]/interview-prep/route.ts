import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, toProfileData } from '@/lib/seed'
import { runInterviewPrepAgent } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = await db.application.findUnique({
    where: { id },
    include: { job: true },
  })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const profile = toProfileData(await getOrCreateProfile())
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
}
