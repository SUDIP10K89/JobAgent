import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runJobSearchAgent, type SeedJob } from '@/lib/agents'
import { fetchAllRealJobs } from '@/lib/job-fetchers'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await requireAuth()
    const profile = toProfileData(await getOrCreateProfileForUser(session.user))

    // Try real job boards first
    let realResult: { added: number; bySource: Record<string, number>; total: number } | null = null
    try {
      realResult = await fetchAllRealJobs(profile, session.user.id)
    } catch (err) {
      console.error('[jobs-search] real fetchers failed:', err)
    }

    // If real sources returned nothing, fall back to LLM synthesis
    let llmAdded = 0
    if (!realResult || realResult.added === 0) {
      try {
        const synthJobs: SeedJob[] = await runJobSearchAgent(profile)
        const existing = await db.job.findMany({
          where: { userId: session.user.id, OR: synthJobs.map((j) => ({ company: j.company, title: j.title })) },
          select: { company: true, title: true },
        })
        const existingKeys = new Set(existing.map((e) => `${e.company}|${e.title}`))

        for (const j of synthJobs) {
          if (existingKeys.has(`${j.company}|${j.title}`)) continue
          await db.job.create({
            data: {
              userId: session.user.id,
              company: j.company,
              title: j.title,
              salary: j.salary ?? null,
              experience: j.experience ?? null,
              location: j.location ?? null,
              remote: j.remote ?? false,
              url: j.url ?? null,
              deadline: j.deadline ?? null,
              description: j.description ?? null,
              source: j.source ?? 'manual',
              status: 'new',
            },
          })
          llmAdded++
        }
      } catch (err) {
        console.error('[jobs-search] LLM fallback failed:', err)
      }
    }

    const added = (realResult?.added ?? 0) + llmAdded
    const message =
      added > 0
        ? `Discovered ${added} new job${added === 1 ? '' : 's'}${
            realResult && realResult.added > 0
              ? ` from ${Object.entries(realResult.bySource)
                  .map(([s, n]) => `${n} ${s.toUpperCase()}`)
                  .join(', ')}`
              : ''
          }`
        : 'No new jobs found. Try again later.'

    if (added > 0) {
      await createNotification({
        type: 'search_complete',
        title: 'Job Search Complete',
        message,
        userId: session.user.id,
        priority: 'low',
      })
    }

    return NextResponse.json({
      added,
      realAdded: realResult?.added ?? 0,
      llmAdded,
      bySource: realResult?.bySource ?? {},
      totalFetched: realResult?.total ?? 0,
      message,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
