'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, TrendingUp, Clock, Target, Mail, Send, Download,
  CheckCircle2, XCircle, Calendar,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from 'recharts'
import { toast } from 'sonner'

interface Analytics {
  sourceBreakdown: { source: string; count: number }[]
  statusBreakdown: { status: string; count: number }[]
  sourceConversion: {
    source: string; total: number; applied: number; responded: number;
    interviewed: number; offered: number; applicationRate: number; responseRate: number
  }[]
  avgResponseDays: number | null
  matchBySource: { source: string; count: number; avgScore: number }[]
  followUpStats: { totalFollowUps: number; pendingFollowUps: number; avgFollowUpsPerApp: number }
  timeline: { date: string; count: number }[]
  funnel: {
    discovered: number; matched: number; applied: number;
    responded: number; interviewed: number; offered: number
  }
  responseRate: number
  totals: {
    jobs: number; applications: number; interviews: number; offers: number; rejections: number
  }
}

const SOURCE_COLORS: Record<string, string> = {
  remoteok: '#10b981',
  arbeitnow: '#06b6d4',
  hn: '#f59e0b',
  linkedin: '#14b8a6',
  indeed: '#8b5cf6',
  glassdoor: '#22c55e',
  wellfound: '#f97316',
  ycombinator: '#ec4899',
  manual: '#64748b',
  llm_fallback: '#94a3b8',
}

export default function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  async function exportCSV() {
    try {
      const r = await fetch('/api/export')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `autojob-applications-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch {
      toast.error('Export failed')
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const maxFunnel = Math.max(
    data.funnel.discovered, data.funnel.matched, data.funnel.applied,
    data.funnel.responded, data.funnel.interviewed, data.funnel.offered, 1
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Analytics
          </h2>
          <p className="text-xs text-muted-foreground">
            Response rates, source performance, follow-up stats — measure your hunt.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Send className="h-4 w-4" />}
          label="Applications"
          value={data.totals.applications}
          sub={`from ${data.totals.jobs} jobs`}
          accent="emerald"
        />
        <StatCard
          icon={<Mail className="h-4 w-4" />}
          label="Response Rate"
          value={`${data.responseRate}%`}
          sub={`${data.funnel.responded} responded`}
          accent="cyan"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Avg. Response"
          value={data.avgResponseDays !== null ? `${data.avgResponseDays}d` : '—'}
          sub="time to first reply"
          accent="teal"
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Interviews"
          value={data.totals.interviews}
          sub={`${data.totals.offers} offer(s) · ${data.totals.rejections} rejected`}
          accent="violet"
        />
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'Discovered', val: data.funnel.discovered, color: 'bg-emerald-500/80' },
              { label: 'Matched', val: data.funnel.matched, color: 'bg-teal-500/80' },
              { label: 'Applied', val: data.funnel.applied, color: 'bg-cyan-500/80' },
              { label: 'Responded', val: data.funnel.responded, color: 'bg-violet-500/80' },
              { label: 'Interviewed', val: data.funnel.interviewed, color: 'bg-fuchsia-500/80' },
              { label: 'Offered', val: data.funnel.offered, color: 'bg-amber-500/80' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground text-right">{row.label}</div>
                <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                  <div
                    className={`h-full ${row.color} transition-all duration-700 flex items-center px-2`}
                    style={{ width: `${Math.max((row.val / maxFunnel) * 100, 4)}%` }}
                  >
                    <span className="text-xs font-bold text-white">{row.val}</span>
                  </div>
                </div>
                <div className="w-16 text-xs text-muted-foreground">
                  {data.funnel.discovered > 0 ? `${Math.round((row.val / data.funnel.discovered) * 100)}%` : '0%'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jobs by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sourceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.sourceBreakdown}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {data.sourceBreakdown.map((entry, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[entry.source] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.205 0.014 240)',
                      border: '1px solid oklch(1 0 0 / 10%)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Source conversion rates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Response Rate by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sourceConversion.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.sourceConversion} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="source" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.205 0.014 240)',
                      border: '1px solid oklch(1 0 0 / 10%)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => `${v}%`}
                  />
                  <Bar dataKey="responseRate" fill="#10b981" radius={[0, 4, 4, 0]} name="Response %" />
                  <Bar dataKey="applicationRate" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Application %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Applications (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.timeline}>
              <defs>
                <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(d) => d.slice(5)}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.205 0.014 240)',
                  border: '1px solid oklch(1 0 0 / 10%)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#appGradient)"
                name="Applications"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Follow-up stats + Match by source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Follow-up Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
              <span className="text-sm">Total follow-ups sent</span>
              <span className="font-bold text-lg tabular-nums">{data.followUpStats.totalFollowUps}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
              <span className="text-sm">Pending follow-ups</span>
              <span className="font-bold text-lg tabular-nums text-amber-300">{data.followUpStats.pendingFollowUps}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
              <span className="text-sm">Avg follow-ups per app</span>
              <span className="font-bold text-lg tabular-nums">{data.followUpStats.avgFollowUpsPerApp}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avg Match Score by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.matchBySource.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No matches yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.matchBySource}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
                  <XAxis dataKey="source" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.205 0.014 240)',
                      border: '1px solid oklch(1 0 0 / 10%)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Avg Match %" />
                </BarChart>
              </ResponsiveContainer>
            )}
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
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
            <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
          </div>
          <div className={`p-2 rounded-lg ring-1 ${accents[accent]} shrink-0`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
