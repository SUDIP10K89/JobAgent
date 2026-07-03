import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, toProfileData } from '@/lib/seed'
import { runJobSearchAgent, type SeedJob } from '@/lib/agents'

export const dynamic = 'force-dynamic'

// POST: Run the job search agent to discover new jobs (simulated via LLM)
export async function POST() {
  const profile = toProfileData(await getOrCreateProfile())
  let newJobs: SeedJob[] = []
  let usedFallback = false

  try {
    newJobs = await runJobSearchAgent(profile)
  } catch (err) {
    console.error('[jobs-search] error:', err)
    usedFallback = true
  }

  if (!newJobs || newJobs.length === 0) {
    return NextResponse.json({ added: 0, message: 'No new jobs found.' })
  }

  // Dedupe by company+title
  const existing = await db.job.findMany({
    where: {
      OR: newJobs.map((j) => ({ company: j.company, title: j.title })),
    },
    select: { company: true, title: true },
  })
  const existingKeys = new Set(existing.map((e) => `${e.company}|${e.title}`))

  let added = 0
  for (const j of newJobs) {
    const key = `${j.company}|${j.title}`
    if (existingKeys.has(key)) continue
    await db.job.create({
      data: {
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
      },
    })
    added++
  }

  return NextResponse.json({
    added,
    total: newJobs.length,
    usedFallback,
    message: `Discovered ${added} new job${added === 1 ? '' : 's'}.`,
  })
}
