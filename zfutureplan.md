## Current Agents

You have **11 AI agents** + 2 workflow components:

| # | Agent | File | Status |
|---|---|---|---|
| 1 | Job Search | `job-searcher.ts` | ✅ Real APIs + LLM fallback |
| 2 | Job Matcher | `job-matcher.ts` | ✅ Scores 0-100 + gaps |
| 3 | Resume Builder | `resume-builder.ts` | ✅ Per-job tailored resumes |
| 4 | Cover Letter Writer | `cover-letter-writer.ts` | ✅ Personalized letters |
| 5 | Form Filling | — | ❌ **Not built** (Playwright auto-submit) |
| 6 | Screening Q&A | `screening-agent.ts` | ✅ Answers common questions |
| 7 | Approval Gate | UI logic | ✅ Human-in-the-loop |
| 8 | Application Tracker | Kanban UI | ✅ 7-stage pipeline |
| 9 | Interview Prep | `interview-prep.ts` | ✅ Questions + topics |
| 10 | Networking Messages | `networking-message.ts` | ✅ LinkedIn outreach |
| 11 | ATS Scorer | `ats-scorer.ts` | ✅ Resume compatibility score |
| 12 | Follow-up Writer | `follow-up-writer.ts` | ✅ Polite follow-up emails |

---

## What's Missing to Be a "Complete Product"

### Tier 1 — Must-Have (blocks real usage)

| Feature | Why it matters | Effort |
|---|---|---|
| **Deployment to Vercel + PostgreSQL** | Can't use it from this sandbox. SQLite doesn't survive on serverless. | 2 hrs |
| **Cron job for auto-search** | "While you sleep" only works if search runs automatically every 4 hrs. | 1 hr |
| **Agent 5: Real form automation (Playwright)** | The "Apply" button is fake right now — it only marks DB status. Real auto-submit is the core promise. | 2-3 days |
| **Email integration (Gmail/Outlook OAuth)** | Without this, recruiters' replies are invisible to the app. The Kanban stays manual forever. | 1-2 days |

### Tier 2 — Should-Have (differentiates from competitors)

| Feature | Why it matters | Effort |
|---|---|---|
| **Resume versioning + history** | Track which resume variant got which response. Learn what works. | 4 hrs |
| **A/B testing resumes** | Send 2 variants of the same resume to similar jobs, see which converts better. | 1 day |
| **Public shareable resume page** | `autojob.com/r/yourname` — share link in DMs, recruiters see live resume. | 3 hrs |
| **Chrome extension** | One-click "Save job" from any job board page → adds to your feed. | 1-2 days |
| **Deadline reminders + calendar sync** | Auto-add application deadlines to Google Calendar. | 3 hrs |
| **Salary intelligence** | Track offered salaries over time, see market range for your role. | 4 hrs |

### Tier 3 — Nice-to-Have (growth features)

| Feature | Why it matters | Effort |
|---|---|---|
| **Billing (Stripe)** | Monetize. Free tier = 5 applications/month, Pro = unlimited. | 1 day |
| **Team mode** | Career coaches manage multiple job seekers. | 2 days |
| **Interview scheduler** | Calendly-style — recruiters book slots directly. | 2 days |
| **Mock interview practice** | Voice-to-voice AI mock interviews before the real one. | 3 days |
| **Public API** | Let other tools integrate (Notion, Raycast, etc.). | 1 day |
| **Mobile app (React Native)** | Apply from phone, get push notifications. | 1 week |

### Tier 4 — Moonshots

| Feature | Why it matters |
|---|---|
| **Browser extension that auto-fills ANY form** | The holy grail — works on Workday, Greenhouse, Lever, company career pages |
| **AI negotiation coach** | Live coaching during salary negotiation calls |
| **Predictive offer modeling** | "Based on your profile + market data, you have 73% chance of offer from X" |

---

## My Honest Recommendation

**Don't build more features.** Build these 4, in this order, then ship:

1. **Deploy to Vercel** (2 hrs) — unblocks everything
2. **Cron job** (1 hr) — delivers the "while you sleep" promise
3. **Gmail integration** (1 day) — makes the tracker actually automatic
4. **Agent 5: Playwright form automation** (2-3 days) — the core differentiator

After that, **use it yourself for 2 weeks**. You'll discover which Tier 2/3 features actually matter based on real pain, not speculation.

A product with 4 working features beats a product with 20 half-built ones every time.

Want me to start on any of these? I'd suggest **deployment setup + cron job** as the immediate next step — it's the lowest effort, highest impact.