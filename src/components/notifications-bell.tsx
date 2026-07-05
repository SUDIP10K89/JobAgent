'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell, BellRing, Target, Clock, CheckCircle2, AlertTriangle,
  Search, Sparkles, X,
} from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  priority: string
  createdAt: string
  jobId?: string | null
  applicationId?: string | null
}

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  async function load() {
    try {
      const r = await fetch('/api/notifications')
      const d = await r.json()
      setNotifications(d.notifications ?? [])
      setUnread(d.unreadCount ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Poll every 30s for new notifications
    pollRef.current = setInterval(load, 30000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function markRead(n: Notification) {
    if (n.read) return
    await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setUnread((u) => Math.max(0, u - 1))
  }

  async function markAllRead() {
    await Promise.all(
      notifications.filter((n) => !n.read).map((n) =>
        fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })
      )
    )
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
    setUnread(0)
    toast.success('All marked as read')
  }

  function getIcon(type: string) {
    switch (type) {
      case 'high_match': return <Target className="h-4 w-4 text-emerald-300" />
      case 'follow_up_reminder': return <Clock className="h-4 w-4 text-amber-300" />
      case 'deadline_warning': return <AlertTriangle className="h-4 w-4 text-rose-300" />
      case 'search_complete': return <Search className="h-4 w-4 text-cyan-300" />
      case 'status_change': return <CheckCircle2 className="h-4 w-4 text-teal-300" />
      default: return <Sparkles className="h-4 w-4 text-violet-300" />
    }
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(iso).toLocaleDateString()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          {unread > 0 ? (
            <BellRing className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border/60">
          <div className="font-medium text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
            {unread > 0 && (
              <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-300 border-rose-500/30">
                {unread} new
              </Badge>
            )}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`w-full text-left p-3 hover:bg-muted/40 transition-colors flex gap-2.5 ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs truncate">{n.title}</span>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <div className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
