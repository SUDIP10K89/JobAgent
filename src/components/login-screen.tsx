'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Github, Mail, Bot, Sparkles, Target, Send, ShieldCheck, Search } from 'lucide-react'

export default function LoginScreen() {
  const hasGithub = !!process.env.NEXT_PUBLIC_HAS_GITHUB
  const hasGoogle = !!process.env.NEXT_PUBLIC_HAS_GOOGLE

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-radial" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Bot className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AutoJob Hunter</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your autonomous job application agent
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <Feature icon={<Search className="h-4 w-4" />} label="Real jobs" />
          <Feature icon={<Target className="h-4 w-4" />} label="AI matching" />
          <Feature icon={<Send className="h-4 w-4" />} label="Auto-apply" />
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur p-6 space-y-4 shadow-xl">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">Sign in to continue</h2>
            <p className="text-xs text-muted-foreground">
              Your profile, jobs, and applications are private to your account.
            </p>
          </div>

          <div className="space-y-2">
            {hasGithub && (
              <Button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
                size="lg"
              >
                <Github className="h-4 w-4 mr-2" />
                Continue with GitHub
              </Button>
            )}

            {hasGoogle && (
              <Button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
                size="lg"
              >
                <Mail className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>
            )}

            {!hasGithub && !hasGoogle && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/90 space-y-1">
                    <div className="font-medium text-amber-100">OAuth not configured</div>
                    <div>
                      To enable login, set these in <code className="text-amber-100 bg-amber-500/20 px-1 rounded">.env</code>:
                    </div>
                    <pre className="text-[10px] bg-amber-500/10 p-2 rounded mt-1 overflow-x-auto">
{`GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...`}
                    </pre>
                    <div className="mt-2">
                      Then restart the server. See <code className="text-amber-100 bg-amber-500/20 px-1 rounded">.env.example</code> for setup links.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center pt-2">
            <ShieldCheck className="h-3 w-3" />
            <span>Your data stays in your account. We never share.</span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to use this tool responsibly and not spam employers.
        </p>
      </div>
    </div>
  )
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30 border border-border/40">
      <span className="text-primary">{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
