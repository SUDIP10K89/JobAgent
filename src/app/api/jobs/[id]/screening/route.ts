import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, toProfileData } from '@/lib/seed'
import { runScreeningAgent } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const profile = toProfileData(await getOrCreateProfile())

  let customQuestions: string[] | undefined
  try {
    const body = await req.json()
    customQuestions = body?.questions
  } catch {
    // no body
  }

  const answers = await runScreeningAgent(
    profile,
    { company: job.company, title: job.title, description: job.description ?? undefined },
    customQuestions
  )

  const app = await db.application.upsert({
    where: { jobId: job.id },
    update: { screeningQA: JSON.stringify(answers) },
    create: { jobId: job.id, status: 'draft', screeningQA: JSON.stringify(answers) },
  })

  return NextResponse.json({ answers, applicationId: app.id })
}
