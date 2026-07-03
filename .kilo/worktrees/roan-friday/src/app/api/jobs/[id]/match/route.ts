import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, toProfileData } from '@/lib/seed'
import { runJobMatcher } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const profile = toProfileData(await getOrCreateProfile())
  const result = await runJobMatcher(profile, {
    company: job.company,
    title: job.title,
    description: job.description ?? undefined,
    experience: job.experience ?? undefined,
    location: job.location ?? undefined,
  })

  const updated = await db.job.update({
    where: { id },
    data: {
      matchScore: result.score,
      matchResult: JSON.stringify(result),
      status: 'matched',
    },
  })

  return NextResponse.json({ job: updated, match: result })
}
