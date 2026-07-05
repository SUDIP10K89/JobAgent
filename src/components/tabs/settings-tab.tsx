'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Globe, Bell, Clock, Target, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AppSettings {
  sources: { remoteok: boolean; arbeitnow: boolean; hn: boolean; llm_fallback: boolean }
  notifications: {
    highMatch: boolean; followUpReminders: boolean; deadlineWarnings: boolean;
    emailEnabled: boolean; emailAddress: string
  }
  followUpDays: number
  autoMatch: boolean
  minMatchScore: number
}

const DEFAULT: AppSettings = {
  sources: { remoteok: true, arbeitnow: true, hn: true, llm_fallback: true },
  notifications: {
    highMatch: true, followUpReminders: true, deadlineWarnings: true,
    emailEnabled: false, emailAddress: '',
  },
  followUpDays: 7,
  autoMatch: false,
  minMatchScore: 0,
}

const SOURCES = [
  { key: 'remoteok', label: 'RemoteOK', desc: 'Remote-only tech jobs (free public API)', color: 'text-emerald-300' },
  { key: 'arbeitnow', label: 'Arbeitnow', desc: 'EU + global job aggregator (free API)', color: 'text-cyan-300' },
  { key: 'hn', label: 'HN Who Is Hiring', desc: 'Monthly Hacker News thread (free API)', color: 'text-amber-300' },
  { key: 'llm_fallback', label: 'LLM Fallback', desc: 'Synthesize jobs if real sources return nothing', color: 'text-violet-300' },
] as const

export default function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setSettings({ ...DEFAULT, ...d.settings }))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const r = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!r.ok) throw new Error()
      toast.success('Settings saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-xs text-muted-foreground">Configure job sources, notifications, and matching.</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>

      {/* Job Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Job Search Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOURCES.map((s) => (
            <div key={s.key} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/40">
              <div className="min-w-0">
                <div className={`text-sm font-medium ${s.color}`}>{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              <Switch
                checked={settings.sources[s.key]}
                onCheckedChange={(v) =>
                  setSettings({
                    ...settings,
                    sources: { ...settings.sources, [s.key]: v },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Matching */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Matching
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-match new jobs</div>
              <div className="text-xs text-muted-foreground">
                Automatically run the Matcher on newly discovered jobs.
              </div>
            </div>
            <Switch
              checked={settings.autoMatch}
              onCheckedChange={(v) => setSettings({ ...settings, autoMatch: v })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Minimum match score to show</Label>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {settings.minMatchScore}%
              </Badge>
            </div>
            <Slider
              value={[settings.minMatchScore]}
              onValueChange={(v) => setSettings({ ...settings, minMatchScore: v[0] })}
              min={0}
              max={90}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Jobs below this score will be hidden from the Job Feed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'highMatch', label: 'High-match alerts', desc: 'Notify when a job scores 85% or higher' },
            { key: 'followUpReminders', label: 'Follow-up reminders', desc: 'Remind me to follow up after no response' },
            { key: 'deadlineWarnings', label: 'Deadline warnings', desc: 'Alert me before application deadlines' },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/40">
              <div>
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-muted-foreground">{n.desc}</div>
              </div>
              <Switch
                checked={settings.notifications[n.key as keyof typeof settings.notifications]}
                onCheckedChange={(v) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [n.key]: v },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Days before suggesting a follow-up</Label>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {settings.followUpDays} days
            </Badge>
          </div>
          <Slider
            value={[settings.followUpDays]}
            onValueChange={(v) => setSettings({ ...settings, followUpDays: v[0] })}
            min={3}
            max={21}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            After applying, if no response in {settings.followUpDays} days, you'll get a reminder to follow up.
          </p>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 space-y-1">
          <div className="font-medium text-amber-100">Real job sources are now live</div>
          <div>
            AutoJob Hunter now fetches real jobs from RemoteOK, Arbeitnow, and Hacker News Who Is Hiring — all free public APIs, no auth required. The LLM fallback only kicks in if all real sources return nothing.
          </div>
        </div>
      </div>
    </div>
  )
}
