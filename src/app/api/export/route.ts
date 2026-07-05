import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

function csvEscape(val: any): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET() {
  try {
    const session = await requireAuth()
    const apps = await db.application.findMany({
      where: { job: { userId: session.user.id } },
      include: { job: true },
    })

    const headers = [
      'Company', 'Title', 'Source', 'Location', 'Remote', 'Salary',
      'Match Score', 'ATS Score', 'Status', 'Applied Date', 'Last Contact',
      'Follow-ups', 'Next Follow-up', 'Has Resume', 'Has Cover Letter',
      'Has Screening Q&A', 'Has Interview Prep', 'Notes', 'Job URL',
    ]

    const rows = apps.map((a) => [
      a.job?.company,
      a.job?.title,
      a.job?.source,
      a.job?.location,
      a.job?.remote ? 'Yes' : 'No',
      a.job?.salary,
      a.job?.matchScore,
      a.job?.atsScore,
      a.status,
      a.appliedAt ? a.appliedAt.toISOString().slice(0, 10) : '',
      a.lastContactAt ? a.lastContactAt.toISOString().slice(0, 10) : '',
      a.followUpCount,
      a.nextFollowUpAt ? a.nextFollowUpAt.toISOString().slice(0, 10) : '',
      a.resumeContent ? 'Yes' : 'No',
      a.coverLetter ? 'Yes' : 'No',
      a.screeningQA ? 'Yes' : 'No',
      a.interviewPrep ? 'Yes' : 'No',
      a.notes,
      a.job?.url,
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')

    const filename = `autojob-applications-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
