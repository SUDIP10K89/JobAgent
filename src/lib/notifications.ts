import { db } from './db'

export interface CreateNotificationInput {
  type: string
  title: string
  message: string
  userId: string
  jobId?: string
  applicationId?: string
  priority?: 'low' | 'normal' | 'high'
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        userId: input.userId,
        jobId: input.jobId ?? null,
        applicationId: input.applicationId ?? null,
        priority: input.priority ?? 'normal',
      },
    })
  } catch (err) {
    console.error('[createNotification] error:', err)
  }
}

export async function getUnreadNotifications(userId: string, limit = 20) {
  return db.notification.findMany({
    where: { read: false, userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getAllNotifications(userId: string, limit = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Scan all applied applications and create follow-up reminders
 * for those that haven't been contacted in 7+ days.
 */
export async function generateFollowUpReminders(userId: string): Promise<number> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)

  const stale = await db.application.findMany({
    where: {
      status: { in: ['applied', 'viewed'] },
      job: { userId },
      OR: [
        { nextFollowUpAt: null, appliedAt: { lt: sevenDaysAgo } },
        { nextFollowUpAt: { lt: now } },
      ],
    },
    include: { job: true },
  })

  let count = 0
  for (const app of stale) {
    const existing = await db.notification.findFirst({
      where: {
        applicationId: app.id,
        type: 'follow_up_reminder',
        createdAt: { gt: new Date(now.getTime() - 24 * 3600000) },
      },
    })
    if (existing) continue

    const daysSinceApplied = app.appliedAt
      ? Math.floor((now.getTime() - app.appliedAt.getTime()) / 86400000)
      : 0

    await createNotification({
      type: 'follow_up_reminder',
      title: 'Follow-up reminder',
      message: `${app.job.company} — ${app.job.title}. Applied ${daysSinceApplied}d ago, no response yet. Consider sending a follow-up.`,
      userId,
      applicationId: app.id,
      jobId: app.jobId,
      priority: 'high',
    })

    await db.application.update({
      where: { id: app.id },
      data: {
        nextFollowUpAt: new Date(now.getTime() + 7 * 86400000),
        followUpCount: { increment: 1 },
      },
    })
    count++
  }
  return count
}

/**
 * Create a notification when a new high-match job is found.
 */
export async function notifyHighMatchJobs(userId: string): Promise<void> {
  const highMatchJobs = await db.job.findMany({
    where: {
      matchScore: { gte: 85 },
      status: 'matched',
      userId,
    },
  })

  for (const job of highMatchJobs) {
    const existing = await db.notification.findFirst({
      where: { jobId: job.id, type: 'high_match', userId },
    })
    if (existing) continue

    await createNotification({
      type: 'high_match',
      title: 'High match found!',
      message: `${job.company} — ${job.title} (${job.matchScore}% match). Review and apply now.`,
      userId,
      jobId: job.id,
      priority: 'high',
    })
  }
}
