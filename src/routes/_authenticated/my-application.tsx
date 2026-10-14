import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, FileText, LoaderCircle, LogOut, Upload } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { EmptyPage } from '@/components/empty-page'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { pageHead } from '@/lib/metadata'
import { validateFile } from '@/lib/application'

export const Route = createFileRoute('/_authenticated/my-application')({
  beforeLoad: ({ context }) => { if (context.identity.roles.some(r => r === 'admin' || r === 'staff')) throw redirect({ to: '/admin' }) },
  head: () => pageHead('My application', 'Your private NORSU BSC dormitory application and status.'),
  component: StudentPage,
})

const statusStyles: Record<string, string> = {
  submitted: 'bg-azure-soft text-primary', under_review: 'bg-azure-soft text-primary',
  approved: 'bg-success-soft text-success', verified: 'bg-success-soft text-success',
  waitlisted: 'bg-warning-soft text-warning', pending: 'bg-warning-soft text-warning', received: 'bg-azure-soft text-primary',
  rejected: 'bg-danger-soft text-destructive',
}
const statusLabels: Record<string, string> = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', waitlisted: 'Waitlisted', rejected: 'Rejected', pending: 'Pending', received: 'Received', verified: 'Verified' }

function Badge({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[value] ?? 'bg-muted text-muted-foreground'}`}>{statusLabels[value] ?? value}</span>
}

function Tracker({ steps, current, done }: { steps: string[]; current: number; done: boolean }) {
  return <ol className="flex flex-wrap items-center gap-y-3">
    {steps.map((s, i) => {
      const reached = done ? i <= current : i < current
      return <li key={s} className="flex items-center">
        <span className="flex items-center gap-2">
          {reached ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className={`h-5 w-5 ${i === current ? 'text-primary' : 'text-muted-foreground'}`} />}
          <span className={`text-xs font-medium ${i === current ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
        </span>
        {i < steps.length - 1 && <span className={`mx-2 h-px w-6 sm:w-10 ${i < current ? 'bg-success' : 'bg-border'}`} />}
      </li>
    })}
  </ol>
}

async function loadApplication() {
  const { data, error } = await supabase.from('applications').select('*').order('submitted_at', { ascending: false }).limit(1)
  if (error) throw new Error('Could not load your application.')
  const app = data?.[0]
  if (!app) return { app: null, docs: [] as { type: string; file_name: string; uploaded_at: string }[] }
  const { data: docs } = await supabase.from('application_documents').select('type,file_name,uploaded_at').eq('application_id', app.id).order('uploaded_at', { ascending: false })
  return { app, docs: docs ?? [] }
}

function StudentPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['my-application'], queryFn: loadApplication })
  return <div>
    <header className="border-b border-border bg-card p-5"><StudentHeader /></header>
    <main className="mx-auto max-w-4xl px-6 py-10">
      {isLoading ? <LoaderCircle className="mx-auto animate-spin text-primary" />
        : error ? <p role="alert" className="rounded-lg bg-danger-soft p-4 text-sm text-destructive">{error.message}</p>
        : !data?.app ? <><EmptyPage kind="student" title="My application" subtitle="Your NORSU BSC dormitory application." /><div className="mt-6 flex justify-center"><Button asChild><Link to="/apply">Start your application</Link></Button></div></>
        : <ApplicationView app={data.app} docs={data.docs} />}
    </main>
  </div>
}

type App = NonNullable<Awaited<ReturnType<typeof loadApplication>>['app']>

function ApplicationView({ app, docs }: { app: App; docs: { type: string; file_name: string; uploaded_at: string }[] }) {
  const statusIndex = { submitted: 0, under_review: 1, approved: 2, waitlisted: 2, rejected: 2 }[app.status as string] ?? 0
  const consentIndex = { pending: 0, received: 1, verified: 2, rejected: 0 }[app.consent_status as string] ?? 0
  const consentDoc = docs.find(d => d.type === 'parental_consent')
  return <div className="space-y-6">
    <div className="surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{app.first_name} {app.last_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{app.student_id} · {app.college_program} · {app.year_level}</p>
          <p className="mt-1 text-xs text-muted-foreground">Submitted {new Date(app.submitted_at).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge value={app.status} />
          <Badge value={app.consent_status} />
        </div>
      </div>
      <div className="mt-6 space-y-5">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application</p><Tracker steps={['Submitted', 'Under review', app.status === 'rejected' ? 'Rejected' : app.status === 'waitlisted' ? 'Waitlisted' : 'Approved']} current={statusIndex} done={app.status === 'approved'} /></div>
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parental consent</p><Tracker steps={['Pending', 'Received', 'Verified']} current={consentIndex} done={app.consent_status === 'verified'} /></div>
      </div>
      {app.admin_remarks && <div className="mt-6 rounded-lg bg-azure-soft p-4 text-sm"><p className="font-semibold">Remarks from the dormitory office</p><p className="mt-1">{app.admin_remarks}</p></div>}
      {app.consent_status === 'rejected' && app.consent_rejection_reason && <div className="mt-4 rounded-lg bg-danger-soft p-4 text-sm text-destructive"><p className="font-semibold">Consent form rejected</p><p className="mt-1">{app.consent_rejection_reason}</p><p className="mt-1">Please upload a new notarized copy below.</p></div>}
    </div>

    <ConsentCard app={app} consentDoc={consentDoc} />

    <div className="surface p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your documents</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {docs.length === 0 && <li className="text-muted-foreground">No documents uploaded yet.</li>}
        {docs.map((d, i) => <li key={i} className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-medium">{d.file_name}</span><span className="text-xs text-muted-foreground">{d.type.replace('_', ' ')} · {new Date(d.uploaded_at).toLocaleDateString()}</span></li>)}
      </ul>
    </div>
  </div>
}

function ConsentCard({ app, consentDoc }: { app: App; consentDoc: { file_name: string; uploaded_at: string } | undefined }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const client = useQueryClient()
  const canUpload = app.consent_status === 'pending' || app.consent_status === 'rejected'

  async function upload() {
    setError('')
    const v = validateFile(file, true)
    if (v) { setError(v); return }
    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has ended. Please sign in again.')
      const ext = file!.type === 'application/pdf' ? 'pdf' : file!.type === 'image/png' ? 'png' : 'jpg'
      const path = `${user.id}/${app.id}/parental_consent-${crypto.randomUUID()}.${ext}`
      const up = await supabase.storage.from('application-documents').upload(path, file!, { contentType: file!.type })
      if (up.error) throw new Error('The file could not be uploaded. Please try again.')
      const doc = await supabase.from('application_documents').insert({ application_id: app.id, type: 'parental_consent', storage_path: path, file_name: file!.name.slice(0, 255) })
      if (doc.error) throw new Error('The document could not be saved. Please try again.')
      const upd = await supabase.from('applications').update({ consent_status: 'received' } as never).eq('id', app.id)
      if (upd.error) throw new Error('Your consent status could not be updated. Please try again.')
      await client.invalidateQueries({ queryKey: ['my-application'] })
      setFile(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  return <div className="surface p-6 sm:p-8">
    <h2 className="text-lg font-semibold">Notarized parental consent</h2>
    <p className="mt-2 text-sm text-muted-foreground">A consent form was sent to your parent or guardian's email ({app.guardian_email}). It must be printed, signed, notarized by an attorney, and then uploaded here as a scan or clear photo.</p>
    {consentDoc && <p className="mt-3 flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" /><span className="font-medium">{consentDoc.file_name}</span><span className="text-xs text-muted-foreground">uploaded {new Date(consentDoc.uploaded_at).toLocaleDateString()}</span></p>}
    {app.consent_status === 'verified' && <p className="mt-4 flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" />Your consent form has been verified.</p>}
    {app.consent_status === 'received' && <p className="mt-4 rounded-lg bg-azure-soft p-3 text-sm text-primary">Your consent form was received and is waiting for the dormitory office to verify it.</p>}
    {canUpload && <div className="mt-4">
      <label className="block rounded-xl border border-dashed border-input bg-card p-5 text-sm font-medium">
        <span className="flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />Upload notarized consent form</span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-3 block w-full text-sm" onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} />
        <span className="mt-2 block text-xs font-normal text-muted-foreground">PDF, JPG, or PNG, up to 5 MB.</span>
        {file && <span className="mt-2 block text-xs text-muted-foreground">{file.name}</span>}
      </label>
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
      <Button className="mt-3" disabled={!file || busy} onClick={upload}>{busy ? <LoaderCircle className="animate-spin" /> : 'Submit consent form'}</Button>
    </div>}
  </div>
}

function StudentHeader() {
  const client = useQueryClient(); const navigate = useNavigate()
  return <div className="mx-auto flex max-w-4xl items-center justify-between gap-3"><Brand /><Button variant="outline" onClick={async () => { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', replace: true }) }}><LogOut />Sign out</Button></div>
}
