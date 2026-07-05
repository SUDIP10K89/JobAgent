import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const app = await db.application.findFirst({
      where: { id, job: { userId: session.user.id } },
      include: { job: true },
    })
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ application: app })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await req.json()

    const app = await db.application.findFirst({
      where: { id, job: { userId: session.user.id } },
    })
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.application.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes,
      },
      include: { job: true },
    })
    return NextResponse.json({ application: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
