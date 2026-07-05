import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { getSettings, saveSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireAuth()
    const settings = await getSettings(session.user.id)
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const updated = await saveSettings(session.user.id, body)
    return NextResponse.json({ settings: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
