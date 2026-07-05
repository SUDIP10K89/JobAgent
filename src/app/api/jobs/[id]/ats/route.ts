import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { runATSScoring } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const job = await db.job.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const app = await db.application.findUnique({ where: { jobId: job.id } })
    if (!app?.resumeContent) {
      return NextResponse.json({ error: 'Generate a resume first' }, { status: 400 })
    }

    const result = await runATSScoring(app.resumeContent, job.description ?? '')

    const updated = await db.job.update({
      where: { id },
      data: {
        atsScore: result.score,
        atsResult: JSON.stringify(result),
      },
    })

    return NextResponse.json({ job: updated, ats: result })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
