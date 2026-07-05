import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { ensureSeedJobs } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await requireAuth()
    await ensureSeedJobs(session.user.id)

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const minScore = url.searchParams.get('minScore')

    const jobs = await db.job.findMany({
      where: {
        userId: session.user.id,
        ...(status && status !== 'all' ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { applications: true },
    })

    let filtered = jobs
    if (minScore) {
      const ms = parseInt(minScore, 10)
      filtered = jobs.filter((j) => (j.matchScore ?? 0) >= ms)
    }

    return NextResponse.json({ jobs: filtered })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { id, status } = body
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }
    const updated = await db.job.update({
      where: { id, userId: session.user.id },
      data: { status },
    })
    return NextResponse.json({ job: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
