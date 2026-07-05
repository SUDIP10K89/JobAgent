import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireAuth()

    const [jobs, apps] = await Promise.all([
      db.job.findMany({ where: { userId: session.user.id } }),
      db.application.findMany({
        where: { job: { userId: session.user.id } },
        include: { job: true },
      }),
    ])

    const statusCounts: Record<string, number> = {}
    for (const a of apps) {
      statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1
    }

    const matchScores = jobs
      .map((j) => j.matchScore ?? 0)
      .filter((s) => s > 0)

    const avgMatch =
      matchScores.length > 0
        ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
        : 0

    const funnel = [
      { stage: 'Jobs Discovered', count: jobs.length },
      { stage: 'Matched (Scored)', count: jobs.filter((j) => j.matchScore !== null).length },
      { stage: 'Applied', count: statusCounts['applied'] ?? 0 },
      { stage: 'Viewed', count: statusCounts['viewed'] ?? 0 },
      { stage: 'HR Contact', count: statusCounts['hr_contact'] ?? 0 },
      { stage: 'Technical', count: statusCounts['technical'] ?? 0 },
      { stage: 'Offer', count: statusCounts['offer'] ?? 0 },
    ]

    const buckets = [
      { range: '0-40', count: 0 },
      { range: '40-60', count: 0 },
      { range: '60-75', count: 0 },
      { range: '75-85', count: 0 },
      { range: '85-100', count: 0 },
    ]
    for (const s of matchScores) {
      if (s < 40) buckets[0].count++
      else if (s < 60) buckets[1].count++
      else if (s < 75) buckets[2].count++
      else if (s < 85) buckets[3].count++
      else buckets[4].count++
    }

    return NextResponse.json({
      totalJobs: jobs.length,
      totalApplications: apps.length,
      avgMatch,
      statusCounts,
      funnel,
      matchBuckets: buckets,
      recentApplications: apps.slice(0, 5),
      topMatches: jobs
        .filter((j) => j.matchScore !== null)
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
        .slice(0, 5),
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
