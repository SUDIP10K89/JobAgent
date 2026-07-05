import { db } from './db'

export interface AppSettings {
  sources: {
    remoteok: boolean
    arbeitnow: boolean
    hn: boolean
    llm_fallback: boolean
  }
  notifications: {
    highMatch: boolean
    followUpReminders: boolean
    deadlineWarnings: boolean
    emailEnabled: boolean
    emailAddress: string
  }
  followUpDays: number
  autoMatch: boolean
  minMatchScore: number
}

const DEFAULT_SETTINGS: AppSettings = {
  sources: { remoteok: true, arbeitnow: true, hn: true, llm_fallback: true },
  notifications: {
    highMatch: true,
    followUpReminders: true,
    deadlineWarnings: true,
    emailEnabled: false,
    emailAddress: '',
  },
  followUpDays: 7,
  autoMatch: false,
  minMatchScore: 0,
}

export async function getSettings(userId: string): Promise<AppSettings> {
  const rows = await db.setting.findMany({ where: { userId } })
  const map: Record<string, any> = {}
  for (const r of rows) {
    try {
      map[r.key] = JSON.parse(r.value)
    } catch {
      map[r.key] = r.value
    }
  }
  return {
    ...DEFAULT_SETTINGS,
    ...map,
    sources: { ...DEFAULT_SETTINGS.sources, ...(map.sources ?? {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(map.notifications ?? {}) },
  }
}

export async function saveSettings(userId: string, settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings(userId)
  const merged: AppSettings = {
    ...current,
    ...settings,
    sources: { ...current.sources, ...(settings.sources ?? {}) },
    notifications: { ...current.notifications, ...(settings.notifications ?? {}) },
  }

  for (const [key, value] of Object.entries(merged)) {
    const existing = await db.setting.findUnique({ where: { userId_key: { userId, key } } })
    if (existing) {
      await db.setting.update({ where: { id: existing.id }, data: { value: JSON.stringify(value) } })
    } else {
      await db.setting.create({ data: { userId, key, value: JSON.stringify(value) } })
    }
  }

  return merged
}
