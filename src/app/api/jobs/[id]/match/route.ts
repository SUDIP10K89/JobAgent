import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runJobMatcher } from '@/lib/agents'
import { createNotification } from '@/lib/notifications'

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

    if (result.score >= 85) {
      await createNotification({
        type: 'high_match',
        title: 'High match found!',
        message: `${job.company} — ${job.title} (${result.score}% match). Interview probability: ${result.probability_of_interview}%.`,
        userId: session.user.id,
        jobId: job.id,
        priority: 'high',
      })
    }

    return NextResponse.json({ job: updated, match: result })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
