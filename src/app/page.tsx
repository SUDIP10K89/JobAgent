'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard, Search, KanbanSquare, Brain, Database,
  Github, Linkedin, Globe, Sparkles, Zap, Bot,
} from 'lucide-react'
import OverviewTab from '@/components/tabs/overview-tab'
import KnowledgeBaseTab from '@/components/tabs/knowledge-base-tab'
import JobFeedTab from '@/components/tabs/job-feed-tab'
import ApplicationsTab from '@/components/tabs/applications-tab'

type TabId = 'overview' | 'knowledge' | 'jobs' | 'applications' | 'interview'

const NAV: { id: TabId; label: string; icon: React.ReactNode; agent?: string; desc: string }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" />, desc: 'Dashboard & funnel' },
  { id: 'knowledge', label: 'Knowledge Base', icon: <Database className="h-4 w-4" />, agent: 'Profile', desc: 'Master profile' },
  { id: 'jobs', label: 'Job Feed', icon: <Search className="h-4 w-4" />, agent: 'Agents 1–6', desc: 'Match & generate' },
  { id: 'applications', label: 'Applications', icon: <KanbanSquare className="h-4 w-4" />, agent: 'Agent 8', desc: 'Track pipeline' },
  { id: 'interview', label: 'Interview Prep', icon: <Brain className="h-4 w-4" />, agent: 'Agent 9', desc: 'Prep materials' },
]

export default function Home() {
  const [tab, setTab] = useState<TabId>('overview')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-md rounded-lg" />
              <div className="relative p-1.5 rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="font-semibold tracking-tight leading-none">AutoJob Hunter</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-1">
                Autonomous Job Application Agent
              </div>
            </div>
            <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse-slow" />
              Running
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Portfolio"
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 border-r border-border/60 flex-col">
          <nav className="p-3 space-y-1 flex-1">
            {NAV.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left group ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
                  }`}
                >
                  <span className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{item.label}</span>
                      {item.agent && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-muted/40 text-muted-foreground">
                          {item.agent}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 truncate">{item.desc}</div>
                  </div>
                </button>
              )
            })}
          </nav>

          <Separator />

          {/* Footer: agent status */}
          <div className="p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Active Agents
            </div>
            {[
              { name: 'Job Search', status: 'idle' },
              { name: 'Matcher', status: 'ready' },
              { name: 'Resume Builder', status: 'ready' },
              { name: 'Cover Letter', status: 'ready' },
              { name: 'Screening', status: 'ready' },
              { name: 'Approval', status: 'manual' },
              { name: 'Tracker', status: 'live' },
              { name: 'Interview Prep', status: 'ready' },
            ].map((a) => (
              <div key={a.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-primary/60" />
                  {a.name}
                </span>
                <span className="flex items-center gap-1 text-[10px]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      a.status === 'live'
                        ? 'bg-emerald-400 animate-pulse-slow'
                        : a.status === 'idle'
                          ? 'bg-zinc-500'
                          : a.status === 'manual'
                            ? 'bg-amber-400'
                            : 'bg-cyan-400'
                    }`}
                  />
                  <span className="text-muted-foreground capitalize">{a.status}</span>
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/60 bg-background/95 backdrop-blur z-30">
          <div className="flex">
            {NAV.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.icon}
                  <span className="truncate max-w-[60px]">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6">
          {/* Mobile header */}
          <div className="md:hidden mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-semibold">{NAV.find((n) => n.id === tab)?.label}</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {NAV.find((n) => n.id === tab)?.desc}
            </p>
          </div>

          {tab === 'overview' && (
            <OverviewTab onNavigate={(t) => setTab(t as TabId)} refreshKey={refreshKey} />
          )}
          {tab === 'knowledge' && <KnowledgeBaseTab />}
          {tab === 'jobs' && (
            <JobFeedTab
              onApplied={() => {
                setTab('applications')
                setRefreshKey((k) => k + 1)
              }}
            />
          )}
          {tab === 'applications' && <ApplicationsTab />}
          {tab === 'interview' && <InterviewPrepLanding onNavigate={(t) => setTab(t as TabId)} />}
        </main>
      </div>
    </div>
  )
}

function InterviewPrepLanding({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-300" /> Agent 9: Interview Prep
        </h2>
        <p className="text-xs text-muted-foreground">
          Interview prep is generated per-application. Open any application in the "Technical" stage to view its prep.
        </p>
      </div>
      <div className="rounded-lg border border-border/60 p-8 text-center">
        <Brain className="h-10 w-10 mx-auto text-violet-300 mb-3" />
        <h3 className="font-medium">No standalone prep yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          When an application moves to the Technical interview stage, this agent generates company research,
          top technical questions, coding questions, and behavioral prompts.
        </p>
        <Button
          onClick={() => onNavigate('applications')}
          className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Go to Applications
        </Button>
      </div>
    </div>
  )
}
