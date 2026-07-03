import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apps = await db.application.findMany({
    include: { job: true },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ applications: apps })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, status, notes } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const updated = await db.application.update({
    where: { id },
    data: {
      status,
      notes: notes !== undefined ? notes : undefined,
    },
    include: { job: true },
  })

  return NextResponse.json({ application: updated })
}
