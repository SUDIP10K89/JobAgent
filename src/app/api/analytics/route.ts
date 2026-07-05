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

    const bySource: Record<string, number> = {}
    for (const j of jobs) {
      bySource[j.source] = (bySource[j.source] ?? 0) + 1
    }

    const byStatus: Record<string, number> = {}
    for (const a of apps) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1
    }

    const sourceConversion: Record<string, { total: number; applied: number; responded: number; interviewed: number; offered: number }> = {}
    for (const j of jobs) {
      if (!sourceConversion[j.source]) {
        sourceConversion[j.source] = { total: 0, applied: 0, responded: 0, interviewed: 0, offered: 0 }
      }
      sourceConversion[j.source].total++
    }
    for (const a of apps) {
      const src = a.job?.source ?? 'manual'
      if (!sourceConversion[src]) sourceConversion[src] = { total: 0, applied: 0, responded: 0, interviewed: 0, offered: 0 }
      sourceConversion[src].applied++
      if (['viewed', 'hr_contact', 'technical', 'offer'].includes(a.status)) sourceConversion[src].responded++
      if (['technical', 'offer'].includes(a.status)) sourceConversion[src].interviewed++
      if (a.status === 'offer') sourceConversion[src].offered++
    }

    const responseTimes: number[] = []
    for (const a of apps) {
      if (a.appliedAt && a.lastContactAt) {
        const days = (a.lastContactAt.getTime() - a.appliedAt.getTime()) / 86400000
        if (days >= 0 && days < 365) responseTimes.push(days)
      }
    }
    const avgResponseDays = responseTimes.length > 0
      ? +(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
      : null

    const matchBySource: Record<string, { count: number; avgScore: number }> = {}
    for (const j of jobs) {
      if (j.matchScore === null) continue
      if (!matchBySource[j.source]) matchBySource[j.source] = { count: 0, avgScore: 0 }
      matchBySource[j.source].count++
      matchBySource[j.source].avgScore += j.matchScore
    }
    for (const k of Object.keys(matchBySource)) {
      matchBySource[k].avgScore = Math.round(matchBySource[k].avgScore / matchBySource[k].count)
    }

    const followUpStats = {
      totalFollowUps: apps.reduce((sum, a) => sum + a.followUpCount, 0),
      pendingFollowUps: apps.filter((a) => a.nextFollowUpAt && a.nextFollowUpAt < new Date()).length,
      avgFollowUpsPerApp: apps.length > 0 ? +(apps.reduce((s, a) => s + a.followUpCount, 0) / apps.length).toFixed(1) : 0,
    }

    const now = Date.now()
    const days: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const dayEnd = dayStart + 86400000
      const count = apps.filter((a) => {
        if (!a.appliedAt) return false
        const t = a.appliedAt.getTime()
        return t >= dayStart && t < dayEnd
      }).length
      days.push({ date: d.toISOString().slice(0, 10), count })
    }

    const funnel = {
      discovered: jobs.length,
      matched: jobs.filter((j) => j.matchScore !== null).length,
      applied: apps.filter((a) => a.status !== 'draft' && a.status !== 'pending_approval').length,
      responded: apps.filter((a) => ['viewed', 'hr_contact', 'technical', 'offer'].includes(a.status)).length,
      interviewed: apps.filter((a) => ['technical', 'offer'].includes(a.status)).length,
      offered: apps.filter((a) => a.status === 'offer').length,
    }

    const appliedCount = funnel.applied
    const respondedCount = funnel.responded
    const responseRate = appliedCount > 0 ? Math.round((respondedCount / appliedCount) * 100) : 0

    return NextResponse.json({
      sourceBreakdown: Object.entries(bySource).map(([source, count]) => ({ source, count })),
      statusBreakdown: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      sourceConversion: Object.entries(sourceConversion).map(([source, data]) => ({
        source,
        ...data,
        applicationRate: data.total > 0 ? Math.round((data.applied / data.total) * 100) : 0,
        responseRate: data.applied > 0 ? Math.round((data.responded / data.applied) * 100) : 0,
      })),
      avgResponseDays,
      matchBySource: Object.entries(matchBySource).map(([source, data]) => ({ source, ...data })),
      followUpStats,
      timeline: days,
      funnel,
      responseRate,
      totals: {
        jobs: jobs.length,
        applications: apps.length,
        interviews: funnel.interviewed,
        offers: funnel.offered,
        rejections: byStatus['rejected'] ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
