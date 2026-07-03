'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Briefcase, Send, Target, TrendingUp, Search, Sparkles, ArrowUpRight,
  Building2, Calendar, Loader2, Zap,
} from 'lucide-react'
import type { DashboardData } from '@/lib/types'
import { getMatchColor, sourceBadge, getStatusInfo } from '@/lib/types'
import { toast } from 'sonner'

interface OverviewTabProps {
  onNavigate: (tab: string) => void
  refreshKey?: number
}

export default function OverviewTab({ onNavigate, refreshKey }: OverviewTabProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  async function runSearch() {
    setSearching(true)
    try {
      const r = await fetch('/api/jobs-search', { method: 'POST' })
      const d = await r.json()
      toast.success(d.message ?? `Search complete`)
      const r2 = await fetch('/api/dashboard')
      const d2 = await r2.json()
      setData(d2)
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1)
  const maxBucket = Math.max(...data.matchBuckets.map((b) => b.count), 1)

  return (
    <div className="space-y-6">
      {/* Hero / Search CTA */}
      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial" />
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  Master Orchestrator
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Your autonomous job hunt is running.
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                The Job Search Agent scans LinkedIn, Indeed, Glassdoor, Wellfound, RemoteOK and YC Jobs
                every few hours. The Matcher scores each role against your profile. Tailored resumes and
                cover letters are generated on demand — you just approve.
              </p>
            </div>
            <Button
              size="lg"
              onClick={runSearch}
              disabled={searching}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" /> Run Job Search Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="h-5 w-5" />}
          label="Jobs Discovered"
          value={data.totalJobs}
          sub={`${data.statusCounts['matched'] ?? 0} scored`}
          accent="emerald"
        />
        <StatCard
          icon={<Send className="h-5 w-5" />}
          label="Applications Sent"
          value={data.totalApplications}
          sub={`${data.statusCounts['applied'] ?? 0} active`}
          accent="cyan"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Avg. Match Score"
          value={`${data.avgMatch}%`}
          sub={`${data.matchBuckets[3].count + data.matchBuckets[4].count} strong matches`}
          accent="teal"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Interviews"
          value={(data.statusCounts['hr_contact'] ?? 0) + (data.statusCounts['technical'] ?? 0)}
          sub={`${data.statusCounts['offer'] ?? 0} offer(s)`}
          accent="violet"
        />
      </div>

      {/* Funnel + match distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Application Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {data.funnel.map((stage, i) => {
              const pct = (stage.count / maxFunnel) * 100
              const colors = [
                'from-emerald-500/80 to-emerald-500/40',
                'from-emerald-500/70 to-teal-500/40',
                'from-teal-500/70 to-cyan-500/40',
                'from-cyan-500/70 to-sky-500/40',
                'from-cyan-500/70 to-violet-500/40',
                'from-violet-500/70 to-fuchsia-500/40',
                'from-fuchsia-500/80 to-rose-500/50',
              ]
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="font-medium tabular-nums">{stage.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors[i]} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Match Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-end justify-between gap-2 h-40">
              {data.matchBuckets.map((b, i) => {
                const h = (b.count / maxBucket) * 100
                const colors = [
                  'bg-rose-500/70',
                  'bg-amber-500/70',
                  'bg-yellow-500/70',
                  'bg-teal-500/70',
                  'bg-emerald-500/80',
                ]
                return (
                  <div key={b.range} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-medium tabular-nums">{b.count}</div>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-md ${colors[i]} transition-all duration-700`}
                        style={{ height: `${Math.max(h, 4)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground text-center">{b.range}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top matches + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Top Matches
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => onNavigate('jobs')}
              >
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-72">
              <div className="space-y-2">
                {data.topMatches.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No matches yet. Run the Job Matcher from the Job Feed.
                  </p>
                )}
                {data.topMatches.map((job) => {
                  const c = getMatchColor(job.matchScore)
                  return (
                    <button
                      key={job.id}
                      onClick={() => onNavigate('jobs')}
                      className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{job.title}</span>
                          <Badge variant="outline" className={`text-[10px] ${sourceBadge(job.source).color}`}>
                            {sourceBadge(job.source).label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {job.company}
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-3 shrink-0">
                        <div className={`text-lg font-bold tabular-nums ${c.text}`}>
                          {job.matchScore}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">match</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Recent Applications
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => onNavigate('applications')}
              >
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-72">
              <div className="space-y-2">
                {data.recentApplications.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No applications yet. Approve your first one from the Job Feed.
                  </p>
                )}
                {data.recentApplications.map((app) => {
                  const status = getStatusInfo(app.status)
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{app.job.title}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {app.job.company}
                          {app.appliedAt && (
                            <span className="ml-2">
                              · {new Date(app.appliedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ml-3 ${status.color}`}>
                        {status.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  accent: 'emerald' | 'cyan' | 'teal' | 'violet'
}) {
  const accents = {
    emerald: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20',
    cyan: 'text-cyan-300 bg-cyan-500/10 ring-cyan-500/20',
    teal: 'text-teal-300 bg-teal-500/10 ring-teal-500/20',
    violet: 'text-violet-300 bg-violet-500/10 ring-violet-500/20',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
            <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
          </div>
          <div className={`p-2.5 rounded-lg ring-1 ${accents[accent]} shrink-0`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
