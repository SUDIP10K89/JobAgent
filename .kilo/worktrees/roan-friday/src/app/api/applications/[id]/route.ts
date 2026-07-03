import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = await db.application.findUnique({
    where: { id },
    include: { job: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ application: app })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updated = await db.application.update({
    where: { id },
    data: {
      status: body.status,
      notes: body.notes,
    },
    include: { job: true },
  })
  return NextResponse.json({ application: updated })
}
