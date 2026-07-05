'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Loader2, Building2, Calendar, ArrowRight, ChevronRight, Brain,
  CheckCircle2, XCircle, Clock, FileText, MailOpen, Download, Send,
  Users, MessageSquare,
} from 'lucide-react'
import type { Application } from '@/lib/types'
import { APP_STATUSES, getStatusInfo, parseScreeningQA, parseInterviewPrep } from '@/lib/types'
import { toast } from 'sonner'

const COLUMN_ORDER = ['draft', 'applied', 'viewed', 'hr_contact', 'technical', 'offer', 'rejected'] as const

export default function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeApp, setActiveApp] = useState<Application | null>(null)
  const [prepLoading, setPrepLoading] = useState(false)
  const [prep, setPrep] = useState<any>(null)
  const [networkingLoading, setNetworkingLoading] = useState(false)
  const [followUpLoading, setFollowUpLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/applications')
      const d = await r.json()
      setApps(d.applications)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(app: Application, status: string) {
    try {
      const r = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: app.id, status }),
      })
      if (!r.ok) throw new Error()
      toast.success(`Moved to ${getStatusInfo(status).label}`)
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)))
      setActiveApp(null)
    } catch {
      toast.error('Update failed')
    }
  }

  async function generatePrep() {
    if (!activeApp) return
    setPrepLoading(true)
    try {
      const r = await fetch(`/api/applications/${activeApp.id}/interview-prep`, { method: 'POST' })
      const d = await r.json()
      setPrep(d.prep)
      setApps((prev) =>
        prev.map((a) =>
          a.id === activeApp.id
            ? { ...a, interviewPrep: JSON.stringify(d.prep), status: 'technical' }
            : a
        )
      )
      toast.success('Interview prep generated — status moved to Technical')
    } catch {
      toast.error('Failed to generate prep')
    } finally {
      setPrepLoading(false)
    }
  }

  function openApp(app: Application) {
    setActiveApp(app)
    setPrep(parseInterviewPrep(app.interviewPrep))
  }

  async function generateNetworking() {
    if (!activeApp) return
    setNetworkingLoading(true)
    try {
      const r = await fetch(`/api/applications/${activeApp.id}/networking`, { method: 'POST' })
      const d = await r.json()
      setApps((prev) =>
        prev.map((a) => (a.id === activeApp.id ? { ...a, networkingMsg: d.message } : a))
      )
      setActiveApp((a) => (a ? { ...a, networkingMsg: d.message } : a))
      toast.success('Networking message generated')
    } catch {
      toast.error('Failed to generate networking message')
    } finally {
      setNetworkingLoading(false)
    }
  }

  async function generateFollowUp() {
    if (!activeApp) return
    setFollowUpLoading(true)
    try {
      const r = await fetch(`/api/applications/${activeApp.id}/follow-up`, { method: 'POST' })
      const d = await r.json()
      setApps((prev) =>
        prev.map((a) =>
          a.id === activeApp.id
            ? {
                ...a,
                lastContactAt: new Date().toISOString(),
                followUpCount: a.followUpCount + 1,
              }
            : a
        )
      )
      toast.success('Follow-up email generated')
      // Open in a way the user can copy
      const blob = new Blob([d.message], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      toast.error('Failed to generate follow-up')
    } finally {
      setFollowUpLoading(false)
    }
  }

  function downloadResumePDF() {
    if (!activeApp) return
    window.open(`/api/applications/${activeApp.id}/resume-pdf`, '_blank')
  }

  const byStatus = (status: string) => apps.filter((a) => a.status === status)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Application Tracker
        </h2>
        <p className="text-xs text-muted-foreground">
          {apps.length} applications · Drag through stages as recruiters respond
        </p>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMN_ORDER.map((status) => {
          const list = byStatus(status)
          const info = getStatusInfo(status)
          return (
            <div key={status} className="min-w-[260px] flex-1 max-w-[320px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{info.label}</span>
                  <Badge variant="outline" className={`text-[10px] ${info.color}`}>{list.length}</Badge>
                </div>
              </div>
              <div className="space-y-2 min-h-[200px] p-1.5 rounded-lg bg-muted/20 border border-border/40">
                {list.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">Empty</div>
                )}
                {list.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => openApp(app)}
                    className="w-full text-left rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="font-medium text-sm leading-tight">{app.job?.title}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Building2 className="h-3 w-3" /> {app.job?.company}
                    </div>
                    {app.appliedAt && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      {app.resumeContent && (
                        <FileText className="h-3 w-3 text-emerald-300" />
                      )}
                      {app.coverLetter && (
                        <MailOpen className="h-3 w-3 text-cyan-300" />
                      )}
                      {app.interviewPrep && (
                        <Brain className="h-3 w-3 text-violet-300" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Application detail modal */}
      <Dialog open={!!activeApp} onOpenChange={(o) => !o && setActiveApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0">
          {activeApp && (
            <>
              <DialogHeader className="shrink-0 pb-2">
                <Badge variant="outline" className={`text-[10px] w-fit ${getStatusInfo(activeApp.status).color}`}>
                  {getStatusInfo(activeApp.status).label}
                </Badge>
                <DialogTitle className="text-xl">{activeApp.job?.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {activeApp.job?.company}</span>
                  {activeApp.appliedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Applied {new Date(activeApp.appliedAt).toLocaleDateString()}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 py-2">
                <div className="space-y-4 pb-4">
                  {/* Status changer */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <h4 className="text-sm font-semibold mb-3">Move to stage</h4>
                    <Select
                      value={activeApp.status}
                      onValueChange={(v) => changeStatus(activeApp, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </section>

                  {/* Interview prep */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Brain className="h-4 w-4 text-violet-300" /> Agent 9: Interview Prep
                      </h4>
                      <Button
                        onClick={generatePrep}
                        disabled={prepLoading}
                        size="sm"
                        variant="outline"
                      >
                        {prepLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Generating...
                          </>
                        ) : (
                          <>
                            <Brain className="h-3.5 w-3.5 mr-1" /> {prep ? 'Regenerate' : 'Generate Prep'}
                          </>
                        )}
                      </Button>
                    </div>
                    {prep ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="text-violet-300 font-medium mb-1">Company Overview</div>
                          <p className="text-muted-foreground">{prep.company_overview}</p>
                        </div>
                        <PrepList title="Top Technical Questions" items={prep.top_technical_questions} color="emerald" />
                        <PrepList title="Top Coding Questions" items={prep.top_coding_questions} color="cyan" />
                        <PrepList title="Behavioral Questions" items={prep.behavioral_questions} color="amber" />
                        <PrepList title="Key Topics to Review" items={prep.key_topics_to_review} color="teal" />
                        <PrepList title="Suggested Resources" items={prep.suggested_resources} color="violet" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Once an interview is scheduled, run this agent. It reads the JD and produces technical questions,
                        coding questions, behavioral questions, and key topics to review.
                      </p>
                    )}
                  </section>

                  {/* Resume */}
                  {activeApp.resumeContent && (
                    <section className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-300" /> Tailored Resume
                        </h4>
                        <Button onClick={downloadResumePDF} size="sm" variant="outline">
                          <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                        </Button>
                      </div>
                      <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono bg-muted/40 p-3 rounded-md max-h-48 overflow-y-auto">
                        {activeApp.resumeContent}
                      </pre>
                    </section>
                  )}

                  {/* Networking message */}
                  <section className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-300" /> Agent 10: Networking Message
                      </h4>
                      <Button onClick={generateNetworking} disabled={networkingLoading} size="sm" variant="outline">
                        {networkingLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Writing...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3.5 w-3.5 mr-1" /> {activeApp.networkingMsg ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </Button>
                    </div>
                    {activeApp.networkingMsg ? (
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted/40 p-3 rounded-md max-h-48 overflow-y-auto">
                        {activeApp.networkingMsg}
                      </pre>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Generates a LinkedIn connection request + follow-up message for recruiters at this company.
                      </p>
                    )}
                  </section>

                  {/* Follow-up — only for applied apps */}
                  {(activeApp.status === 'applied' || activeApp.status === 'viewed') && (
                    <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Send className="h-4 w-4 text-amber-300" /> Agent 12: Follow-up Email
                        </h4>
                        <Button onClick={generateFollowUp} disabled={followUpLoading} size="sm" variant="outline">
                          {followUpLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Drafting...
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5 mr-1" /> Generate Follow-up
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Follow-ups sent: <span className="font-medium text-foreground">{activeApp.followUpCount}</span></div>
                        {activeApp.lastContactAt && (
                          <div>Last contact: <span className="font-medium text-foreground">{new Date(activeApp.lastContactAt).toLocaleDateString()}</span></div>
                        )}
                        {activeApp.nextFollowUpAt && (
                          <div>Next follow-up: <span className="font-medium text-foreground">{new Date(activeApp.nextFollowUpAt).toLocaleDateString()}</span></div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Cover letter */}
                  {activeApp.coverLetter && (
                    <section className="rounded-lg border border-border/60 p-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <MailOpen className="h-4 w-4 text-cyan-300" /> Cover Letter
                      </h4>
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans bg-muted/40 p-3 rounded-md max-h-48 overflow-y-auto">
                        {activeApp.coverLetter}
                      </pre>
                    </section>
                  )}

                  {/* Screening answers */}
                  {activeApp.screeningQA && parseScreeningQA(activeApp.screeningQA).length > 0 && (
                    <section className="rounded-lg border border-border/60 p-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-300" /> Screening Answers
                      </h4>
                      <div className="space-y-2">
                        {parseScreeningQA(activeApp.screeningQA).map((q, i) => (
                          <div key={i} className="rounded-md bg-muted/30 p-2.5">
                            <div className="text-xs font-medium text-primary mb-1">Q: {q.question}</div>
                            <div className="text-xs text-muted-foreground">A: {q.answer}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PrepList({
  title, items, color,
}: {
  title: string
  items: string[]
  color: 'emerald' | 'cyan' | 'amber' | 'teal' | 'violet'
}) {
  if (!items || items.length === 0) return null
  const colors = {
    emerald: 'text-emerald-300',
    cyan: 'text-cyan-300',
    amber: 'text-amber-300',
    teal: 'text-teal-300',
    violet: 'text-violet-300',
  }
  return (
    <div>
      <div className={`font-medium mb-1 ${colors[color]}`}>{title}</div>
      <ul className="space-y-1 text-muted-foreground">
        {items.map((q, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
