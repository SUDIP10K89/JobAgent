import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST = approve and submit application (simulated submit)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
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
}
