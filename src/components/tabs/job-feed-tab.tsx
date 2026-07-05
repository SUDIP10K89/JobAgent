'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, Search, Target, FileText, MailOpen, ShieldQuestion, CheckCircle2,
  XCircle, Building2, MapPin, Briefcase, Clock, ExternalLink, Sparkles,
  AlertTriangle, Wand2, Send, FileCheck, ChevronRight,
} from 'lucide-react'
import type { Job, MatchResult } from '@/lib/types'
import { getMatchColor, sourceBadge, parseMatchResult } from '@/lib/types'
import { toast } from 'sonner'

interface JobFeedTabProps {
  onApplied?: () => void
}

type TabValue = 'all' | 'new' | 'matched' | 'shortlisted'

export default function JobFeedTab({ onApplied }: JobFeedTabProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabValue>('all')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  // Active job modal
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [coverLoading, setCoverLoading] = useState(false)
  const [screeningLoading, setScreeningLoading] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [resume, setResume] = useState<{ content: string; tailored_summary: string; highlighted_projects: string[] } | null>(null)
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [screening, setScreening] = useState<{ question: string; answer: string }[]>([])
  const [step, setStep] = useState<'idle' | 'matching' | 'ready' | 'applying'>('idle')
  const [atsLoading, setAtsLoading] = useState(false)
  const [ats, setAts] = useState<any>(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/jobs')
      const d = await r.json()
      setJobs(d.jobs)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  async function runSearch() {
    setSearching(true)
    try {
      const r = await fetch('/api/jobs-search', { method: 'POST' })
      const d = await r.json()
      toast.success(d.message ?? 'Search complete')
      await loadJobs()
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  function openJob(job: Job) {
    setActiveJob(job)
    setResume(null)
    setCoverLetter('')
    setScreening([])
    setAts(null)
    const m = parseMatchResult(job.matchResult)
    setStep(m ? 'ready' : 'idle')
  }

  async function runATS() {
    if (!activeJob) return
    setAtsLoading(true)
    try {
      const r = await fetch(`/api/jobs/${activeJob.id}/ats`, { method: 'POST' })
      const d = await r.json()
      if (d.error) {
        toast.error(d.error)
      } else {
        setAts(d.ats)
        toast.success(`ATS score: ${d.ats.score}%`)
      }
    } catch {
      toast.error('ATS scoring failed')
    } finally {
      setAtsLoading(false)
    }
  }

  async function runMatch() {
    if (!activeJob) return
    setMatchLoading(true)
    try {
      const r = await fetch(`/api/jobs/${activeJob.id}/match`, { method: 'POST' })
      const d = await r.json()
      if (d.job) {
        setActiveJob({ ...activeJob, matchScore: d.job.matchScore, matchResult: d.job.matchResult })
        // also reflect in the list
        setJobs((prev) =>
          prev.map((j) =>
            j.id === d.job.id
              ? { ...j, matchScore: d.job.matchScore, matchResult: d.job.matchResult, status: d.job.status }
              : j
          )
        )
      }
      setStep('ready')
      toast.success(`Match score: ${d.match.score}%`)
    } catch {
      toast.error('Match failed')
    } finally {
      setMatchLoading(false)
    }
  }

  async function runResume() {
    if (!activeJob) return
    setResumeLoading(true)
    try {
      const r = await fetch(`/api/jobs/${activeJob.id}/resume`, { method: 'POST' })
      const d = await r.json()
      setResume(d.resume)
      toast.success('Tailored resume generated')
    } catch {
      toast.error('Resume generation failed')
    } finally {
      setResumeLoading(false)
    }
  }

  async function runCoverLetter() {
    if (!activeJob) return
    setCoverLoading(true)
    try {
      const r = await fetch(`/api/jobs/${activeJob.id}/cover-letter`, { method: 'POST' })
      const d = await r.json()
      setCoverLetter(d.coverLetter)
      toast.success('Cover letter generated')
    } catch {
      toast.error('Cover letter failed')
    } finally {
      setCoverLoading(false)
    }
  }

  async function runScreening() {
    if (!activeJob) return
    setScreeningLoading(true)
    try {
      const r = await fetch(`/api/jobs/${activeJob.id}/screening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const d = await r.json()
      setScreening(d.answers)
      toast.success('Screening answers generated')
    } catch {
      toast.error('Screening failed')
    } finally {
      setScreeningLoading(false)
    }
  }

  async function approveAndApply() {
    if (!activeJob) return
    setApplyLoading(true)
    try {
      const r = await fetch(`/api/jobs/${activeJob.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Auto-submitted by AutoJob Hunter' }),
      })
      const d = await r.json()
      toast.success(`Application submitted to ${activeJob.company}!`)
      // Remove from list (or update status)
      setJobs((prev) => prev.map((j) => (j.id === activeJob.id ? { ...j, status: 'shortlisted' } : j)))
      setActiveJob(null)
      onApplied?.()
    } catch {
      toast.error('Apply failed')
    } finally {
      setApplyLoading(false)
    }
  }

  async function dismiss(job: Job) {
    await fetch('/api/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id, status: 'dismissed' }),
    })
    setJobs((prev) => prev.filter((j) => j.id !== job.id))
    toast.success('Job dismissed')
  }

  const filtered = jobs
    .filter((j) => j.status !== 'dismissed')
    .filter((j) => (tab === 'all' ? true : j.status === tab))
    .filter((j) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.location ?? '').toLowerCase().includes(q)
      )
    })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Job Feed
          </h2>
          <p className="text-xs text-muted-foreground">
            {jobs.length} jobs discovered · Auto-refreshes every few hours
          </p>
        </div>
        <Button onClick={runSearch} disabled={searching} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" /> Discover New Jobs
            </>
          )}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <Input
          placeholder="Search by title, company, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-xs"
        />
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="matched">Matched</TabsTrigger>
            <TabsTrigger value="shortlisted">Applied</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No jobs match this filter. Try running the Job Search Agent.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => {
            const c = getMatchColor(job.matchScore)
            const m = parseMatchResult(job.matchResult)
            return (
              <Card
                key={job.id}
                className="hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => openJob(job)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${sourceBadge(job.source).color}`}>
                          {sourceBadge(job.source).label}
                        </Badge>
                        {job.remote && (
                          <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-300 border-teal-500/30">
                            Remote
                          </Badge>
                        )}
                        {job.status === 'shortlisted' && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold leading-tight">{job.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {job.company}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {job.location}
                          </span>
                        )}
                        {job.experience && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {job.experience}
                          </span>
                        )}
                      </div>
                    </div>
                    {job.matchScore !== null ? (
                      <div className={`flex flex-col items-center justify-center p-2 rounded-lg ring-1 ${c.bg} ${c.ring} shrink-0`}>
                        <span className={`text-2xl font-bold tabular-nums ${c.text}`}>{job.matchScore}</span>
                        <span className="text-[9px] uppercase text-muted-foreground tracking-wider">match</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg ring-1 ring-zinc-500/20 bg-zinc-500/10 shrink-0">
                        <Target className="h-5 w-5 text-zinc-400 mb-0.5" />
                        <span className="text-[9px] uppercase text-muted-foreground tracking-wider">score</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>

                  {m && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Interview probability:</span>
                      <div className="flex-1 max-w-32">
                        <Progress value={m.probability_of_interview} className="h-1.5" />
                      </div>
                      <span className="font-medium tabular-nums">{m.probability_of_interview}%</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {job.salary && <span className="font-medium text-emerald-300">{job.salary}</span>}
                      {job.deadline && (
                        <span className="ml-2 flex items-center gap-1 inline-flex">
                          <Clock className="h-3 w-3" /> Due {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:text-primary hover:bg-primary/10 text-xs"
                    >
                      Review & Apply <Wand2 className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Approval Modal */}
      <Dialog open={!!activeJob} onOpenChange={(o) => !o && setActiveJob(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col gap-0">
          {activeJob && (
            <>
              <DialogHeader className="shrink-0 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${sourceBadge(activeJob.source).color}`}>
                    {sourceBadge(activeJob.source).label}
                  </Badge>
                  {activeJob.remote && (
                    <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-300 border-teal-500/30">
                      Remote
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{activeJob.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {activeJob.company}</span>
                  {activeJob.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {activeJob.location}</span>}
                  {activeJob.experience && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {activeJob.experience}</span>}
                  {activeJob.salary && <span className="text-emerald-300 font-medium">{activeJob.salary}</span>}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 py-2">
                <div className="space-y-4 pb-4">
                  {/* Match section */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" /> Agent 2: Job Matcher
                      </h4>
                      {activeJob.matchScore !== null && (
                        <Badge variant="outline" className={`text-xs ${getMatchColor(activeJob.matchScore).bg} ${getMatchColor(activeJob.matchScore).text} ${getMatchColor(activeJob.matchScore).ring}`}>
                          {activeJob.matchScore}% match
                        </Badge>
                      )}
                    </div>
                    {(() => {
                      const m = parseMatchResult(activeJob.matchResult)
                      if (!m) {
                        return (
                          <Button onClick={runMatch} disabled={matchLoading} size="sm" variant="outline">
                            {matchLoading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Scoring...
                              </>
                            ) : (
                              <>
                                <Target className="h-3.5 w-3.5 mr-1" /> Run Match Analysis
                              </>
                            )}
                          </Button>
                        )
                      }
                      return (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">{m.summary}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Strengths
                              </div>
                              <ul className="space-y-0.5 text-muted-foreground">
                                {m.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <div className="text-rose-300 font-medium mb-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Gaps
                              </div>
                              {m.missing_skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {m.missing_skills.map((s, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] bg-rose-500/10 text-rose-300 border-rose-500/30">
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No major gaps!</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Interview probability:</span>
                            <Progress value={m.probability_of_interview} className="h-2 flex-1 max-w-48" />
                            <span className="font-medium tabular-nums">{m.probability_of_interview}%</span>
                          </div>
                          <Button onClick={runMatch} disabled={matchLoading} size="sm" variant="ghost" className="text-xs">
                            {matchLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Target className="h-3 w-3 mr-1" />}
                            Re-score
                          </Button>
                        </div>
                      )
                    })()}
                  </section>

                  {/* Resume section */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Agent 3: Resume Builder
                      </h4>
                      <Button onClick={runResume} disabled={resumeLoading} size="sm" variant="outline">
                        {resumeLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5 mr-1" /> {resume ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </Button>
                    </div>
                    {resume ? (
                      <div className="space-y-2">
                        {resume.tailored_summary && (
                          <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                            <div className="text-[10px] uppercase tracking-wider text-primary font-medium mb-1">
                              Tailored Summary
                            </div>
                            <p className="text-xs leading-relaxed">{resume.tailored_summary}</p>
                          </div>
                        )}
                        {resume.highlighted_projects.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="text-emerald-300">Highlighted:</span>{' '}
                            {resume.highlighted_projects.join(' · ')}
                          </div>
                        )}
                        <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono bg-muted/40 p-3 rounded-md max-h-64 overflow-y-auto">
                          {resume.content}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        The agent will tailor your master resume to this JD — moving relevant projects to the top,
                        rewriting the summary, and emphasizing matching skills.
                      </p>
                    )}
                  </section>

                  {/* Cover letter */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <MailOpen className="h-4 w-4 text-primary" /> Agent 4: Cover Letter Writer
                      </h4>
                      <Button onClick={runCoverLetter} disabled={coverLoading} size="sm" variant="outline">
                        {coverLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Writing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5 mr-1" /> {coverLetter ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </Button>
                    </div>
                    {coverLetter ? (
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted/40 p-3 rounded-md max-h-48 overflow-y-auto">
                        {coverLetter}
                      </pre>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Generates a personalized 3-paragraph cover letter referencing the company and your most relevant projects.
                      </p>
                    )}
                  </section>

                  {/* Screening */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <ShieldQuestion className="h-4 w-4 text-primary" /> Agent 6: Screening Questions
                      </h4>
                      <Button onClick={runScreening} disabled={screeningLoading} size="sm" variant="outline">
                        {screeningLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Drafting...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5 mr-1" /> {screening.length > 0 ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </Button>
                    </div>
                    {screening.length > 0 ? (
                      <div className="space-y-2">
                        {screening.map((q, i) => (
                          <div key={i} className="rounded-md bg-muted/30 p-2.5">
                            <div className="text-xs font-medium text-primary mb-1">Q: {q.question}</div>
                            <div className="text-xs text-muted-foreground leading-relaxed">A: {q.answer}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Generates first-person answers to common screening questions (why this company, salary expectations, etc.).
                      </p>
                    )}
                  </section>

                  {/* ATS Scoring */}
                  {resume && (
                    <section className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-primary" /> Agent 11: ATS Scoring
                        </h4>
                        <Button onClick={runATS} disabled={atsLoading} size="sm" variant="outline">
                          {atsLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Scoring...
                            </>
                          ) : (
                            <>
                              <FileCheck className="h-3.5 w-3.5 mr-1" /> {ats ? 'Re-score' : 'Run ATS Check'}
                            </>
                          )}
                        </Button>
                      </div>
                      {ats ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`text-3xl font-bold ${ats.score >= 80 ? 'text-emerald-300' : ats.score >= 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                              {ats.score}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>ATS Compatibility Score</div>
                              <div>Keyword coverage: {ats.keyword_coverage}% · Format: {ats.format_score}%</div>
                            </div>
                          </div>
                          {ats.issues?.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-xs font-medium text-muted-foreground">Issues found:</div>
                              {ats.issues.map((issue: any, i: number) => (
                                <div key={i} className={`text-xs p-2 rounded border ${
                                  issue.severity === 'high'
                                    ? 'border-rose-500/30 bg-rose-500/5 text-rose-200'
                                    : issue.severity === 'medium'
                                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-200'
                                      : 'border-zinc-500/30 bg-zinc-500/5 text-zinc-300'
                                }`}>
                                  <div className="font-medium">{issue.issue}</div>
                                  <div className="text-muted-foreground mt-0.5">→ {issue.fix}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {ats.recommendations?.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Recommendations:</div>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {ats.recommendations.map((r: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Score your resume against ATS (Applicant Tracking System) best practices — checks keyword coverage, format, and identifies issues.
                        </p>
                      )}
                    </section>
                  )}

                  {/* JD */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <h4 className="text-sm font-semibold mb-2">Job Description</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {activeJob.description}
                    </p>
                    {activeJob.url && (
                      <a
                        href={activeJob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        View original posting <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </section>
                </div>
              </div>

              <DialogFooter className="border-t border-border/60 pt-4 shrink-0">
                <div className="flex items-center gap-2 w-full">
                  <Button
                    variant="ghost"
                    className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
                    onClick={() => {
                      dismiss(activeJob)
                      setActiveJob(null)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Dismiss
                  </Button>
                  <div className="flex-1" />
                  <Button
                    onClick={approveAndApply}
                    disabled={
                      applyLoading ||
                      activeJob.matchScore === null ||
                      !resume ||
                      !coverLetter
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {applyLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> Approve & Apply
                      </>
                    )}
                  </Button>
                </div>
                {(activeJob.matchScore === null || !resume || !coverLetter) && (
                  <p className="text-[10px] text-muted-foreground text-right w-full mt-2">
                    {activeJob.matchScore === null && 'Run match analysis first. '}
                    {!resume && 'Generate a resume. '}
                    {!coverLetter && 'Generate a cover letter.'}
                  </p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
