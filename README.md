# AutoJob Hunter

## Overview

AutoJob Hunter is an autonomous job application agent built with Next.js, Tailwind CSS, Prisma, and OpenAI. It helps a candidate manage their job search by:

- Discovering and seeding job listings
- Matching the candidate profile to jobs
- Generating tailored resumes
- Writing personalized cover letters
- Producing screening question answers
- Preparing interview materials
- Tracking applications and workflow status

The app is implemented as a Next.js App Router project with a single-page dashboard and a backend API layer.

## Key Features

- Candidate profile management
- Job discovery via simulated LLM-generated listings
- Job matching with match score and gap analysis
- Resume generation tailored to specific job postings
- Cover letter authoring for each position
- Screening question answer generation
- Interview prep package generation
- Application tracking and workflow status updates
- Prisma-managed SQLite database with seed data

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma ORM
- SQLite (via `DATABASE_URL`)
- OpenAI-compatible LLM client (`openai` package)
- Shadcn/ui components
- Lucide icons
- Zustand, React Query, TanStack Table

## Project Structure

- `src/app/`
  - `layout.tsx` — application root metadata and providers
  - `page.tsx` — main dashboard UI and navigation
  - `api/` — serverless API endpoints
- `src/components/` — reusable UI primitives and tabs
- `src/lib/`
  - `db.ts` — Prisma client initialization
  - `agents.ts` — LLM agent orchestration and business logic
  - `llm.ts` — OpenAI request wrappers and response parsing
  - `seed.ts` — initial profile, job, and application seeding utilities
  - `types.ts` — shared TypeScript types
  - `utils.ts` — helper utilities
- `prisma/schema.prisma` — database schema definitions

## Data Model

### Profile

The `Profile` model stores candidate knowledge and search preferences.

Fields include:

- `name`, `email`, `phone`, `location`, `linkedin`, `github`, `portfolio`
- `headline`, `summary`
- JSON-encoded fields: `skills`, `projects`, `education`, `experience`, `achievements`, `preferences`, `jobTitles`, `locations`
- Search preferences: `remoteOnly`, `minSalary`

### Job

The `Job` model stores discovered or seeded job listings.

Fields include:

- `company`, `title`, `salary`, `experience`, `location`, `remote`, `url`, `deadline`, `description`
- Agent output: `matchScore`, `matchResult`
- Workflow status: `status`

### Application

The `Application` model tracks application artifacts and status.

Fields include:

- `jobId`, relation to `Job`
- `status`, `appliedAt`
- Generated content: `resumeContent`, `coverLetter`, `screeningQA`, `interviewPrep`
- `notes`

## API Endpoints

The backend API is implemented under `src/app/api`.

### `/api/profile`
- `GET` — returns the active profile and seeds default jobs and applications if needed.
- `PATCH` — updates profile fields and JSON-based arrays.

### `/api/jobs-search`
- `POST` — runs the job search agent to generate or discover new job listings and stores them in the database.

### `/api/jobs/[id]/match`
- `POST` — runs the job matching agent for a specific job and stores the score and match details.

### `/api/jobs/[id]/resume`
- `POST` — generates a tailored resume for a specific job and stores it on the draft application.

### `/api/jobs/[id]/cover-letter`
- `POST` — generates a personalized cover letter for the selected job and stores it on the draft application.

### `/api/jobs/[id]/screening`
- `POST` — generates answers to screening questions for the selected job and stores them on the application.

### `/api/jobs/[id]/apply`
- `POST` — marks the application as applied, updates workflow status, and records the application date.

### `/api/applications`
- `GET` — fetches tracked applications with related job metadata.
- `PATCH` — updates application status and notes.

### `/api/applications/[id]`
- `GET` — returns a single application with job relation.
- `PATCH` — updates an application record.

### `/api/applications/[id]/interview-prep`
- `POST` — generates interview prep material and updates the application.

## LLM Agents

The app delegates business logic to the agents in `src/lib/agents.ts`:

- `runJobMatcher` — compares candidate profile to a job and returns a match score, missing skills, strengths, weaknesses, and interview probability.
- `runResumeBuilder` — creates a tailored, ATS-friendly resume.
- `runCoverLetterWriter` — writes a personalized cover letter.
- `runScreeningAgent` — produces screening question answers.
- `runInterviewPrepAgent` — creates interview preparation guidance.
- `runJobSearchAgent` — synthesizes realistic job listings from candidate preferences.

The `src/lib/llm.ts` helper wraps OpenAI requests and attempts to parse strict JSON responses. It also provides deterministic fallbacks if the API fails.

## Setup and Installation

### Prerequisites

- Node.js (recommended v20+)
- npm or bun
- SQLite or a compatible `DATABASE_URL`
- OpenAI API credentials

### Local setup

1. Clone the repository.
2. Create a `.env` file in the project root.
3. Add required variables:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
DATABASE_URL=file:./dev.db
```

4. Install dependencies:

```bash
npm install
```

5. Generate Prisma client (optional if running migrations manually):

```bash
npm run db:generate
```

6. Run the app in development:

```bash
npm run dev
```

### Database setup

The project uses Prisma with SQLite by default. If using SQLite, ensure `DATABASE_URL` points to a local file.

To push the schema to the database:

```bash
npm run db:push
```

To run migrations:

```bash
npm run db:migrate
```

To reset the database:

```bash
npm run db:reset
```

## Running

- `npm run dev` — start the Next.js development server on port 3000.
- `npm run build` — build the production bundle.
- `npm run start` — start the production server using `bun` after build.
- `npm run lint` — run ESLint across the codebase.

## Seed and Fallback Behavior

The project includes seeded default content to provide a working experience without manual data entry:

- `src/lib/seed.ts` seeds a default `Profile` if none exists.
- `ensureSeedJobs()` seeds fallback job listings when the profile route is requested and no jobs exist.
- `ensureSeedApplications()` seeds a few sample application records.
- LLM helpers use fallback content when the external model call fails.

## UI and Frontend

- `src/app/page.tsx` contains the main dashboard UI with tab navigation and agent status.
- The UI is composed of Shadcn-style component primitives under `src/components/ui`.
- Feature tabs include Overview, Knowledge Base, Job Feed, Applications, and Interview Prep.

## Notes and Considerations

- No user authentication is implemented, so the app assumes a single active profile.
- The OpenAI integration uses strict JSON prompts to keep returned data structured.
- Job discovery is simulated by the `runJobSearchAgent` LLM agent rather than scraping real job boards.
- Production `npm run start` depends on `bun` being available.

## Future Improvements

- Add real authentication and multi-user support
- Replace simulated job discovery with real API integrations
- Add resume export/download and application submission automation
- Add WebSocket or polling for real-time application updates
- Add caching and retries for LLM calls

## File References

- `src/lib/db.ts` — Prisma client singleton
- `src/lib/llm.ts` — OpenAI client wrapper and JSON parser
- `src/lib/agents.ts` — main AI agent functions
- `src/lib/seed.ts` — seeded profile, job, and application data
- `prisma/schema.prisma` — database schema
- `src/app/api/` — backend API routes
- `src/app/page.tsx` — dashboard UI
- `src/app/layout.tsx` — root layout and metadata

---

This documentation is intended to help developers understand, run, and extend AutoJob Hunter quickly.
