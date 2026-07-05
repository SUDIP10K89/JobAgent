import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getOrCreateProfileForUser, toProfileData } from '@/lib/session'
import { generateResumePDF } from '@/lib/pdf-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const app = await db.application.findFirst({
      where: { id, job: { userId: session.user.id } },
      include: { job: true },
    })
    if (!app || !app.resumeContent) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const profile = toProfileData(await getOrCreateProfileForUser(session.user))

    const pdfBuffer = generateResumePDF(app.resumeContent, {
      name: profile.name,
      jobTitle: app.job.title,
      company: app.job.company,
    })

    const filename = `${profile.name.replace(/\s+/g, '_')}_${app.job.title.replace(/\s+/g, '_')}_${app.job.company.replace(/\s+/g, '_')}.pdf`

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
