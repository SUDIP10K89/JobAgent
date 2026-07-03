'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, Plus, X, Save, User, GitBranch, GraduationCap, Trophy,
  Briefcase, Target, Settings, Sparkles,
} from 'lucide-react'
import type { ProfileData } from '@/lib/types'
import { toast } from 'sonner'

export default function KnowledgeBaseTab() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [achievementInput, setAchievementInput] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [locInput, setLocInput] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function patch<K extends keyof ProfileData>(key: K, val: ProfileData[K]) {
    setProfile((p) => (p ? { ...p, [key]: val } : p))
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!r.ok) throw new Error('Failed')
      toast.success('Knowledge base saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/80 backdrop-blur border-b border-border/60">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Knowledge Base
            </h2>
            <p className="text-xs text-muted-foreground">
              This is the master profile every AI agent reads from. Keep it rich.
            </p>
          </div>
          <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Knowledge Base
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Basics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name">
            <Input value={profile.name} onChange={(e) => patch('name', e.target.value)} />
          </Field>
          <Field label="Headline">
            <Input value={profile.headline ?? ''} onChange={(e) => patch('headline', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={profile.email} onChange={(e) => patch('email', e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={profile.phone ?? ''} onChange={(e) => patch('phone', e.target.value)} />
          </Field>
          <Field label="Location">
            <Input value={profile.location ?? ''} onChange={(e) => patch('location', e.target.value)} />
          </Field>
          <Field label="LinkedIn">
            <Input value={profile.linkedin ?? ''} onChange={(e) => patch('linkedin', e.target.value)} />
          </Field>
          <Field label="GitHub">
            <Input value={profile.github ?? ''} onChange={(e) => patch('github', e.target.value)} />
          </Field>
          <Field label="Portfolio">
            <Input value={profile.portfolio ?? ''} onChange={(e) => patch('portfolio', e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Professional Summary">
              <Textarea
                rows={3}
                value={profile.summary ?? ''}
                onChange={(e) => patch('summary', e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g. React, Node.js, MongoDB)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && skillInput.trim()) {
                  patch('skills', [...profile.skills, skillInput.trim()])
                  setSkillInput('')
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                if (skillInput.trim()) {
                  patch('skills', [...profile.skills, skillInput.trim()])
                  setSkillInput('')
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, i) => (
              <Badge
                key={`${s}-${i}`}
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition-colors"
                onClick={() => patch('skills', profile.skills.filter((_, j) => j !== i))}
              >
                {s} <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" /> Projects
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                patch('projects', [
                  ...profile.projects,
                  { name: 'New Project', tech: [], description: '', link: '' },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.projects.map((p, i) => (
            <div key={i} className="rounded-lg border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={p.name}
                  placeholder="Project name"
                  onChange={(e) => {
                    const next = [...profile.projects]
                    next[i] = { ...next[i], name: e.target.value }
                    patch('projects', next)
                  }}
                  className="font-medium"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
                  onClick={() => patch('projects', profile.projects.filter((_, j) => j !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                rows={2}
                placeholder="What does it do? What problem does it solve?"
                value={p.description ?? ''}
                onChange={(e) => {
                  const next = [...profile.projects]
                  next[i] = { ...next[i], description: e.target.value }
                  patch('projects', next)
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Tech stack (comma separated)">
                  <Input
                    value={(p.tech ?? []).join(', ')}
                    onChange={(e) => {
                      const next = [...profile.projects]
                      next[i] = {
                        ...next[i],
                        tech: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      }
                      patch('projects', next)
                    }}
                  />
                </Field>
                <Field label="Link">
                  <Input
                    value={p.link ?? ''}
                    onChange={(e) => {
                      const next = [...profile.projects]
                      next[i] = { ...next[i], link: e.target.value }
                      patch('projects', next)
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}
          {profile.projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Experience + Education */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Experience
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patch('experience', [
                    ...profile.experience,
                    { role: '', company: '', duration: '', description: '' },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.experience.map((e, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={e.role}
                    placeholder="Role"
                    onChange={(ev) => {
                      const next = [...profile.experience]
                      next[i] = { ...next[i], role: ev.target.value }
                      patch('experience', next)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-300 hover:bg-rose-500/10"
                    onClick={() => patch('experience', profile.experience.filter((_, j) => j !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={e.company}
                    placeholder="Company"
                    onChange={(ev) => {
                      const next = [...profile.experience]
                      next[i] = { ...next[i], company: ev.target.value }
                      patch('experience', next)
                    }}
                  />
                  <Input
                    value={e.duration ?? ''}
                    placeholder="Duration"
                    onChange={(ev) => {
                      const next = [...profile.experience]
                      next[i] = { ...next[i], duration: ev.target.value }
                      patch('experience', next)
                    }}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder="What did you do?"
                  value={e.description ?? ''}
                  onChange={(ev) => {
                    const next = [...profile.experience]
                    next[i] = { ...next[i], description: ev.target.value }
                    patch('experience', next)
                  }}
                />
              </div>
            ))}
            {profile.experience.length === 0 && (
              <p className="text-sm text-muted-foreground">No experience added.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Education
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patch('education', [
                    ...profile.education,
                    { degree: '', school: '', year: '' },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.education.map((e, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={e.degree}
                    placeholder="Degree"
                    onChange={(ev) => {
                      const next = [...profile.education]
                      next[i] = { ...next[i], degree: ev.target.value }
                      patch('education', next)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-300 hover:bg-rose-500/10"
                    onClick={() => patch('education', profile.education.filter((_, j) => j !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={e.school}
                    placeholder="School"
                    onChange={(ev) => {
                      const next = [...profile.education]
                      next[i] = { ...next[i], school: ev.target.value }
                      patch('education', next)
                    }}
                  />
                  <Input
                    value={e.year ?? ''}
                    placeholder="Year"
                    onChange={(ev) => {
                      const next = [...profile.education]
                      next[i] = { ...next[i], year: ev.target.value }
                      patch('education', next)
                    }}
                  />
                </div>
              </div>
            ))}
            {profile.education.length === 0 && (
              <p className="text-sm text-muted-foreground">No education added.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add an achievement (e.g. Winner — Hackathon Nepal 2023)"
              value={achievementInput}
              onChange={(e) => setAchievementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && achievementInput.trim()) {
                  patch('achievements', [...profile.achievements, achievementInput.trim()])
                  setAchievementInput('')
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                if (achievementInput.trim()) {
                  patch('achievements', [...profile.achievements, achievementInput.trim()])
                  setAchievementInput('')
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {profile.achievements.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span className="text-sm flex-1">{a}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-300 hover:bg-rose-500/10 h-7 w-7 p-0"
                  onClick={() => patch('achievements', profile.achievements.filter((_, j) => j !== i))}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {profile.achievements.length === 0 && (
              <p className="text-sm text-muted-foreground">No achievements added.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Job Search Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Target Job Titles</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="e.g. MERN Developer"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && titleInput.trim()) {
                    patch('jobTitles', [...profile.jobTitles, titleInput.trim()])
                    setTitleInput('')
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (titleInput.trim()) {
                    patch('jobTitles', [...profile.jobTitles, titleInput.trim()])
                    setTitleInput('')
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.jobTitles.map((t, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30"
                  onClick={() => patch('jobTitles', profile.jobTitles.filter((_, j) => j !== i))}
                >
                  {t} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Target Locations</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="e.g. Kathmandu, Nepal"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && locInput.trim()) {
                    patch('locations', [...profile.locations, locInput.trim()])
                    setLocInput('')
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (locInput.trim()) {
                    patch('locations', [...profile.locations, locInput.trim()])
                    setLocInput('')
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.locations.map((t, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-teal-500/10 text-teal-300 border-teal-500/30 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30"
                  onClick={() => patch('locations', profile.locations.filter((_, j) => j !== i))}
                >
                  {t} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Remote only</div>
              <div className="text-xs text-muted-foreground">
                When on, the Job Search Agent will only return remote roles.
              </div>
            </div>
            <Switch checked={profile.remoteOnly} onCheckedChange={(v) => patch('remoteOnly', v)} />
          </div>

          <Field label="Minimum salary (NPR / month, optional)">
            <Input
              type="number"
              value={profile.minSalary ?? ''}
              onChange={(e) =>
                patch('minSalary', e.target.value ? parseInt(e.target.value, 10) : null)
              }
              placeholder="e.g. 60000"
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
