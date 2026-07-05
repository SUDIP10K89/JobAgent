import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { runScreeningAgent } from '@/lib/agents'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const job = await db.job.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const profile = toProfileData(await getOrCreateProfileForUser(session.user))

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
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
