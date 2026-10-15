import { useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/status-badge'
import { supabase } from '@/integrations/supabase/client'
import { pageHead } from '@/lib/metadata'
import { fullName, logAudit, type ApplicationRow } from '@/lib/admin'

export const Route = createFileRoute('/_authenticated/admin/applications/$id')({
  beforeLoad: ({ context }) => { if (!context.identity.roles.includes('admin')) throw redirect({ to: '/admin' }) },
  head: () => pageHead('Review application', 'Review a student dormitory application.'),
  component: ReviewPage,
})

const docLabels: Record<string, string> = { load_slip: 'Load slip', school_id: 'School ID', parental_consent: 'Notarized parental consent' }

async function loadReview(id: string) {
  const { data: app, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error('This application could not be loaded.')
  if (!app) return null
  const { data: docs } = await supabase.from('application_documents').select('*').eq('application_id', id).order('uploaded_at', { ascending: false })
  return { app, docs: docs ?? [] }
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium break-words">{value || '—'}</p></div>
}

function ReviewPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-application', id], queryFn: () => loadReview(id) })
  const [remarks, setRemarks] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Loading application…</p>
  if (error) return <p className="text-destructive">{error.message}</p>
  if (!data) return <p>Application not found. <Link to="/admin/applications" className="text-primary underline">Back to applications</Link></p>
  const { app, docs } = data
  const remarkText = remarks ?? app.admin_remarks ?? ''

  async function update(patch: Partial<ApplicationRow>, action: string, meta: Record<string, unknown>, ok: string) {
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('applications').update({ ...patch, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', app.id)
    setBusy(false)
    if (error) return toast.error(error.message.includes('verified') ? 'Consent must be verified before approval.' : 'The change could not be saved. Please try again.')
    await logAudit(action, 'application', app.id, meta)
    toast.success(ok)
    await qc.invalidateQueries({ queryKey: ['admin-application', id] }); void qc.invalidateQueries({ queryKey: ['admin-applications'] })
  }

  async function view(doc: (typeof docs)[number]) {
    const { data: signed, error } = await supabase.storage.from('application-documents').createSignedUrl(doc.storage_path, 60)
    if (error || !signed) return toast.error('This document could not be opened.')
    await logAudit('view_document', 'application_document', doc.id, { application_id: app.id, type: doc.type })
    setPreview({ url: signed.signedUrl, name: doc.file_name })
  }

  const setStatus = (status: ApplicationRow['status']) => update({ status, admin_remarks: remarkText.trim() || null }, 'change_status', { from: app.status, to: status }, `Application marked ${status.replace('_', ' ')}.`)

  return <>
    <Button asChild variant="ghost" className="mb-4"><Link to="/admin/applications"><ArrowLeft />Applications</Link></Button>
    <div className="mb-7 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold">{fullName(app)}</h1><StatusBadge value={app.status} /><StatusBadge value={app.consent_status} /></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {[
          ['Personal', [['Student ID', app.student_id], ['Sex', app.sex], ['Birthdate', app.birthdate], ['Contact number', app.contact_number], ['Email', app.email]]],
          ['Address', [['Home address', app.home_address], ['Municipality', app.municipality]]],
          ['School', [['College / program', app.college_program], ['Year level', app.year_level], ['Preferred building', app.preferred_building]]],
          ['Guardian', [['Name', app.guardian_name], ['Relationship', app.guardian_relationship], ['Contact', app.guardian_contact], ['Email', app.guardian_email]]],
          ['Emergency contact', [['Name', app.emergency_name], ['Relationship', app.emergency_relationship], ['Contact', app.emergency_contact]]],
          ['Privacy', [['Notice version', app.privacy_notice_version], ['Accepted', new Date(app.privacy_accepted_at).toLocaleString()], ['Submitted', new Date(app.submitted_at).toLocaleString()]]],
        ].map(([title, fields]) => <section key={title as string} className="surface p-5"><h2 className="mb-4 font-semibold">{title as string}</h2><div className="grid gap-4 sm:grid-cols-2">{(fields as [string, string | null][]).map(([l, v]) => <Field key={l} label={l} value={v} />)}</div></section>)}
        <section className="surface p-5"><h2 className="mb-4 font-semibold">Documents</h2>
          {!docs.length && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
          <ul className="divide-y divide-border">{docs.map(d => <li key={d.id} className="flex items-center gap-3 py-3"><FileText className="h-5 w-5 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{docLabels[d.type]}</p><p className="truncate text-xs text-muted-foreground">{d.file_name} · {new Date(d.uploaded_at).toLocaleDateString()}</p></div><Button size="sm" variant="outline" onClick={() => view(d)}><Eye />View</Button></li>)}</ul>
          {preview && <div className="mt-4"><div className="mb-2 flex items-center justify-between text-sm"><span className="truncate font-medium">{preview.name}</span><Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Close</Button></div>{/\.pdf$/i.test(preview.name) ? <iframe title={preview.name} src={preview.url} className="h-[600px] w-full rounded-lg border border-border" /> : <img src={preview.url} alt={preview.name} className="max-h-[600px] w-full rounded-lg border border-border object-contain" />}<p className="mt-1 text-xs text-muted-foreground">This link expires in 60 seconds.</p></div>}
        </section>
      </div>
      <div className="space-y-6">
        <section className="surface p-5"><h2 className="mb-1 font-semibold">Parental consent</h2><p className="mb-4 text-sm text-muted-foreground">Current: {app.consent_status}</p>
          {app.consent_rejection_reason && <p className="mb-3 rounded-lg bg-danger-soft p-3 text-sm text-destructive">Rejected: {app.consent_rejection_reason}</p>}
          <Button className="mb-3 w-full" disabled={busy || app.consent_status !== 'received'} onClick={() => update({ consent_status: 'verified', consent_rejection_reason: null }, 'verify_consent', {}, 'Consent verified.')}>Verify consent</Button>
          <Textarea placeholder="Reason for rejecting consent (required)" maxLength={500} value={reason} onChange={e => setReason(e.target.value)} />
          <Button variant="outline" className="mt-2 w-full text-destructive" disabled={busy || !reason.trim() || app.consent_status === 'pending'} onClick={() => update({ consent_status: 'rejected', consent_rejection_reason: reason.trim() }, 'reject_consent', { reason: reason.trim() }, 'Consent rejected.').then(() => setReason(''))}>Reject consent</Button>
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={app.original_consent_received} disabled={busy} onChange={e => update({ original_consent_received: e.target.checked }, 'original_consent_received', { value: e.target.checked }, 'Saved.')} />Original consent form received</label>
        </section>
        <section className="surface p-5"><h2 className="mb-4 font-semibold">Decision</h2>
          <Textarea placeholder="Remarks shown to the student" maxLength={1000} value={remarkText} onChange={e => setRemarks(e.target.value)} />
          <div className="mt-3 grid gap-2">
            {app.status === 'submitted' && <Button variant="outline" disabled={busy} onClick={() => setStatus('under_review')}>Mark under review</Button>}
            <Button disabled={busy || app.consent_status !== 'verified'} onClick={() => setStatus('approved')}>Approve</Button>
            {app.consent_status !== 'verified' && <p className="text-xs text-muted-foreground">Approve is available once consent is verified.</p>}
            <Button variant="outline" disabled={busy} onClick={() => setStatus('waitlisted')}>Waitlist</Button>
            <Button variant="outline" className="text-destructive" disabled={busy} onClick={() => setStatus('rejected')}>Reject application</Button>
          </div>
        </section>
      </div>
    </div>
  </>
}
