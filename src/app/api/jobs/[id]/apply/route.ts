import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const job = await db.job.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))

    const app = await db.application.upsert({
      where: { jobId: job.id },
      update: {
        status: 'applied',
        appliedAt: new Date(),
        notes: body.notes ?? undefined,
      },
      create: {
        jobId: job.id,
        status: 'applied',
        appliedAt: new Date(),
        notes: body.notes,
      },
    })

    await db.job.update({
      where: { id: job.id },
      data: { status: 'shortlisted' },
    })

    return NextResponse.json({ application: app })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
