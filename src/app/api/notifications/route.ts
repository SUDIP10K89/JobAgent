import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { generateFollowUpReminders, notifyHighMatchJobs } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireAuth()

    try {
      await generateFollowUpReminders(session.user.id)
      await notifyHighMatchJobs(session.user.id)
    } catch (err) {
      console.error('[notifications] bg tasks error:', err)
    }

    const [all, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.notification.count({ where: { read: false, userId: session.user.id } }),
    ])

    return NextResponse.json({ notifications: all, unreadCount })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
