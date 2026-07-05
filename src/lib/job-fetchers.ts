/**
 * Real external job board fetchers.
 * All sources are free public APIs — no auth required.
 */

import { db } from './db'
import type { ProfileData } from './agents'

export interface FetchedJob {
  source: string
  externalId: string
  company: string
  title: string
  salary?: string | null
  experience?: string | null
  location?: string | null
  remote: boolean
  url?: string | null
  description?: string | null
  tags: string[]
}

// =====================================================
// REMOTEOK — https://remoteok.com/api
// Free, no auth. Returns array of remote jobs.
// =====================================================

export async function fetchRemoteOK(profile: ProfileData): Promise<FetchedJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'AutoJob-Hunter/1.0 (https://github.com/autojob-hunter)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []

    // First item is metadata — skip it
    const jobs = data.slice(1)

    // Filter by user's target titles / skills
    const targetKeywords = [
      ...profile.jobTitles,
      ...profile.skills.slice(0, 6).flatMap((s) => s.toLowerCase().split(/[\s/]+/)),
    ].map((s) => s.toLowerCase())

    return jobs
      .filter((j: any) => {
        if (!j.position || !j.company) return false
        const text = `${j.position} ${j.tags?.join(' ') ?? ''} ${j.description ?? ''}`.toLowerCase()
        // Must match at least one target keyword
        return targetKeywords.some((k) => k && k.length > 2 && text.includes(k))
      })
      .slice(0, 25)
      .map((j: any): FetchedJob => ({
        source: 'remoteok',
        externalId: String(j.id),
        company: j.company,
        title: j.position,
        salary: j.salary ? `${j.salary}` : null,
        experience: null,
        location: 'Remote',
        remote: true,
        url: j.url ? `https://remoteok.com/l/${j.url}` : `https://remoteok.com/remote-${j.slug}`,
        description: (j.description ?? '').slice(0, 2000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 10) : [],
      }))
  } catch (err) {
    console.error('[fetchRemoteOK] error:', err)
    return []
  }
}

// =====================================================
// ARBEITNOW — https://www.arbeitnow.com/api/job-board-api
// Free, no auth. Returns jobs from many EU/global companies.
// =====================================================

export async function fetchArbeitnow(profile: ProfileData): Promise<FetchedJob[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const jobs = data?.data ?? []
    if (!Array.isArray(jobs)) return []

    const targetKeywords = [
      ...profile.jobTitles,
      ...profile.skills.slice(0, 6),
    ].map((s) => s.toLowerCase())

    return jobs
      .filter((j: any) => {
        if (!j.title || !j.company_name) return false
        const text = `${j.title} ${j.tags?.join(' ') ?? ''} ${j.description ?? ''}`.toLowerCase()
        return targetKeywords.some((k) => k && k.length > 2 && text.includes(k))
      })
      .slice(0, 20)
      .map((j: any): FetchedJob => ({
        source: 'arbeitnow',
        externalId: j.slug ?? String(j.id ?? ''),
        company: j.company_name,
        title: j.title,
        salary: null,
        experience: null,
        location: j.location ?? null,
        remote: j.remote ?? false,
        url: j.url ?? `https://www.arbeitnow.com/jobs/${j.slug}`,
        description: (j.description ?? '').slice(0, 2000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        tags: Array.isArray(j.tags) ? j.tags : [],
      }))
  } catch (err) {
    console.error('[fetchArbeitnow] error:', err)
    return []
  }
}

// =====================================================
// HACKER NEWS "Who Is Hiring" — monthly thread
// We fetch the latest thread via Algolia HN Search API
// =====================================================

export async function fetchHNWhoIsHiring(profile: ProfileData): Promise<FetchedJob[]> {
  try {
    // Search for "Ask HN: Who is hiring" — get the most recent story
    const searchRes = await fetch(
      'https://hn.algolia.com/api/v1/search?query=Ask+HN%3A+Who+is+hiring&tags=story&hitsPerPage=1',
      { signal: AbortSignal.timeout(15000) }
    )
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()
    const storyId = searchData?.hits?.[0]?.objectID
    if (!storyId) return []

    // Fetch all comments of that story
    const commentsRes = await fetch(
      `https://hn.algolia.com/api/v1/search?tags=comment,story_${storyId}&hitsPerPage=50`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (!commentsRes.ok) return []
    const commentsData = await commentsRes.json()
    const comments = commentsData?.hits ?? []

    const targetKeywords = [
      ...profile.jobTitles,
      ...profile.skills.slice(0, 6),
    ].map((s) => s.toLowerCase())

    return comments
      .filter((c: any) => {
        if (!c.comment_text) return false
        const text = c.comment_text.toLowerCase()
        return targetKeywords.some((k) => k && k.length > 2 && text.includes(k))
      })
      .slice(0, 20)
      .map((c: any): FetchedJob => {
        // Parse HN comment: first line is usually "Company | Role | Location | ..."
        const text = c.comment_text || ''
        const firstLine = text.split('\n')[0].slice(0, 200)
        const parts = firstLine.split('|').map((p: string) => p.trim())
        const company = parts[0]?.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 60) || 'HN Company'
        const title = parts[1]?.slice(0, 100) || profile.jobTitles[0] || 'Software Engineer'
        const location = parts[2]?.slice(0, 60) || 'See posting'

        return {
          source: 'hn',
          externalId: c.objectID,
          company,
          title,
          salary: null,
          experience: null,
          location,
          remote: /remote/i.test(text.slice(0, 500)),
          url: `https://news.ycombinator.com/item?id=${c.objectID}`,
          description: text.slice(0, 2000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          tags: [],
        }
      })
  } catch (err) {
    console.error('[fetchHNWhoIsHiring] error:', err)
    return []
  }
}

// =====================================================
// MAIN: Run all fetchers and save new jobs to DB
// =====================================================

export async function fetchAllRealJobs(profile: ProfileData, userId: string): Promise<{
  added: number
  bySource: Record<string, number>
  total: number
}> {
  const [remoteOK, arbeitnow, hn] = await Promise.allSettled([
    fetchRemoteOK(profile),
    fetchArbeitnow(profile),
    fetchHNWhoIsHiring(profile),
  ])

  const all: FetchedJob[] = [
    ...(remoteOK.status === 'fulfilled' ? remoteOK.value : []),
    ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
    ...(hn.status === 'fulfilled' ? hn.value : []),
  ]

  // Also pull from LLM-synthesized fallback (in case all real sources return nothing)
  let added = 0
  const bySource: Record<string, number> = {}

  // Dedupe by source+externalId (scoped to this user)
  const existingExternal = await db.job.findMany({
    where: {
      userId,
      OR: all.map((j) => ({ source: j.source, externalId: j.externalId })),
    },
    select: { source: true, externalId: true },
  })
  const existingKeys = new Set(existingExternal.map((e) => `${e.source}|${e.externalId}`))

  // Also dedupe by company+title to avoid near-duplicates
  const existingByTitle = await db.job.findMany({
    where: { userId, OR: all.map((j) => ({ company: j.company, title: j.title })) },
    select: { company: true, title: true },
  })
  const existingTitleKeys = new Set(existingByTitle.map((e) => `${e.company}|${e.title}`))

  for (const j of all) {
    const extKey = `${j.source}|${j.externalId}`
    const titleKey = `${j.company}|${j.title}`
    if (existingKeys.has(extKey) || existingTitleKeys.has(titleKey)) continue

    await db.job.create({
      data: {
        userId,
        source: j.source,
        externalId: j.externalId,
        company: j.company,
        title: j.title,
        salary: j.salary ?? null,
        experience: j.experience ?? null,
        location: j.location ?? null,
        remote: j.remote,
        url: j.url ?? null,
        description: j.description ?? null,
        tags: JSON.stringify(j.tags),
        status: 'new',
      },
    })
    added++
    bySource[j.source] = (bySource[j.source] ?? 0) + 1
    existingKeys.add(extKey)
    existingTitleKeys.add(titleKey)
  }

  return { added, bySource, total: all.length }
}
