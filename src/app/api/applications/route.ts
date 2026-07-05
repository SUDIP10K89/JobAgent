import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireAuth()
    const apps = await db.application.findMany({
      where: { job: { userId: session.user.id } },
      include: { job: true },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ applications: apps })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { id, status, notes } = body
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

    // Verify ownership
    const app = await db.application.findFirst({
      where: { id, job: { userId: session.user.id } },
    })
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.application.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { job: true },
    })

    return NextResponse.json({ application: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
