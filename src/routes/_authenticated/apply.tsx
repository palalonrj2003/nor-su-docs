import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CalendarX, CheckCircle2, LoaderCircle, Upload } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/brand'
import { PrivacyContent } from '@/components/legal-page'
import { pageHead } from '@/lib/metadata'
import { PRIVACY_NOTICE_VERSION, isPeriodOpen, stepSchemas, validateFile } from '@/lib/application'

export const Route = createFileRoute('/_authenticated/apply')({
  beforeLoad: ({ context }) => { if (context.identity.roles.some(r => r === 'admin' || r === 'staff')) throw redirect({ to: '/admin' }) },
  head: () => pageHead('Apply', 'Apply for a bed at the NORSU BSC dormitory.'),
  component: ApplyPage,
})

const steps = ['Privacy', 'Personal', 'Address & school', 'Guardian', 'Preference', 'Documents', 'Review']
type Values = Record<string, string>
const empty: Values = { first_name: '', middle_name: '', last_name: '', sex: '', birthdate: '', contact_number: '', email: '', home_address: '', municipality: '', student_id: '', college_program: '', year_level: '', guardian_name: '', guardian_relationship: '', guardian_contact: '', guardian_email: '', emergency_name: '', emergency_relationship: '', emergency_contact: '', preferred_building: '' }
const labels: Record<string, string> = { first_name: 'First name', middle_name: 'Middle name (optional)', last_name: 'Last name', sex: 'Sex', birthdate: 'Birthdate', contact_number: 'Contact number', email: 'Email address', home_address: 'Home address', municipality: 'Municipality', student_id: 'Student ID', college_program: 'College / program', year_level: 'Year level', guardian_name: 'Guardian full name', guardian_relationship: 'Relationship to you', guardian_contact: 'Guardian contact number', guardian_email: 'Guardian email', emergency_name: 'Emergency contact name', emergency_relationship: 'Emergency contact relationship', emergency_contact: 'Emergency contact number', preferred_building: 'Preferred room type or building (optional)' }
const inputCls = 'mt-2 h-12 w-full rounded-lg border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring'

async function loadState() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: periods, error } = await supabase.from('application_periods').select('id,name,opens_at,closes_at,is_active').eq('is_active', true)
  if (error) throw new Error('Could not load the application period.')
  const period = (periods ?? []).find(p => isPeriodOpen(p)) ?? null
  const { data: existing } = period && user ? await supabase.from('applications').select('id').eq('user_id', user.id).eq('period_id', period.id).maybeSingle() : { data: null }
  return { period, hasApplied: !!existing, email: user?.email ?? '' }
}

function ApplyPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['apply-state'], queryFn: loadState })
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4"><Brand /><Button asChild variant="ghost"><Link to="/my-application"><ArrowLeft />Back</Link></Button></div></header>
    <main className="mx-auto max-w-2xl px-5 py-8">
      {isLoading ? <LoaderCircle className="mx-auto animate-spin text-primary" /> : error ? <p role="alert" className="rounded-lg bg-danger-soft p-4 text-sm text-destructive">{error.message}</p>
        : !data?.period ? <Notice icon={<CalendarX className="h-10 w-10 text-primary" />} title="Applications are closed" text="There is no open application period right now. Please check again later." />
        : data.hasApplied ? <Notice icon={<CheckCircle2 className="h-10 w-10 text-success" />} title="Application already submitted" text="You have already applied for this period. You can view it on your application page." />
        : <ApplyForm periodId={data.period.id} periodName={data.period.name} email={data.email} />}
    </main>
  </div>
}

function Notice({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="surface p-8 text-center"><div className="mb-4 flex justify-center">{icon}</div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm text-muted-foreground">{text}</p><Button asChild className="mt-6"><Link to="/my-application">Go to my application</Link></Button></div>
}

function ApplyForm({ periodId, periodName, email }: { periodId: string; periodName: string; email: string }) {
  const [step, setStep] = useState(0)
  const [agreed, setAgreed] = useState(false)
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null)
  const [values, setValues] = useState<Values>({ ...empty, email })
  const [files, setFiles] = useState<{ load_slip?: File; school_id?: File }>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const navigate = useNavigate(); const client = useQueryClient()
  const set = (k: string, v: string) => setValues(s => ({ ...s, [k]: v }))

  function next() {
    const e: Record<string, string> = {}
    if (step === 0) { if (!agreed) e["agree"] = 'You must agree to continue.'; else if (!acceptedAt) setAcceptedAt(new Date().toISOString()) }
    else if (step <= 4) { const r = stepSchemas[step as 1 | 2 | 3 | 4].safeParse(values); if (!r.success) r.error.issues.forEach(i => { e[String(i.path[0])] ??= i.message }) }
    else if (step === 5) { const a = validateFile(files.load_slip, true); const b = validateFile(files.school_id, false); if (a) e["load_slip"] = a; if (b) e["school_id"] = b }
    setErrors(e)
    if (!Object.keys(e).length) { setStep(step + 1); window.scrollTo(0, 0) }
  }

  async function submit() {
    setBusy(true); setSubmitError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has ended. Please sign in again.')
      const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]))
      const { data: app, error } = await supabase.from('applications').insert({
        ...payload, sex: payload["sex"] as 'male' | 'female', preferred_building: payload["preferred_building"] || null,
        user_id: user.id, period_id: periodId, privacy_notice_version: PRIVACY_NOTICE_VERSION, privacy_accepted_at: acceptedAt ?? new Date().toISOString(),
      } as never).select('id').single()
      if (error) throw new Error(error.code === '23505' ? 'You have already applied for this period.' : 'Your application could not be submitted. Please try again.')
      for (const type of ['load_slip', 'school_id'] as const) {
        const file = files[type]; if (!file) continue
        const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
        const path = `${user.id}/${app.id}/${type}-${crypto.randomUUID()}.${ext}`
        const up = await supabase.storage.from('application-documents').upload(path, file, { contentType: file.type })
        if (up.error) throw new Error('A document could not be uploaded. Please try again from your application page.')
        const doc = await supabase.from('application_documents').insert({ application_id: app.id, type, storage_path: path, file_name: file.name.slice(0, 255) })
        if (doc.error) throw new Error('A document could not be saved. Please try again.')
      }
      await client.invalidateQueries()
      await navigate({ to: '/my-application' })
    } catch (err) { setSubmitError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const field = (k: string, type = 'text') => <label key={k} className="block text-sm font-medium">{labels[k]}<input type={type} value={values[k]} onChange={e => set(k, e.target.value)} maxLength={300} className={inputCls} />{errors[k] && <span className="mt-1 block text-xs text-destructive">{errors[k]}</span>}</label>
  const fileField = (k: 'load_slip' | 'school_id', label: string) => <label className="block rounded-xl border border-dashed border-input bg-card p-5 text-sm font-medium"><span className="flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />{label}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-3 block w-full text-sm" onChange={e => setFiles(f => ({ ...f, [k]: e.target.files?.[0] }))} />{files[k] && <span className="mt-2 block text-xs text-muted-foreground">{files[k]!.name}</span>}{errors[k] && <span className="mt-1 block text-xs text-destructive">{errors[k]}</span>}</label>

  return <div>
    <p className="text-xs font-medium text-primary">{periodName.toUpperCase()}</p>
    <h1 className="mt-1 text-2xl font-bold">Dormitory application</h1>
    <div className="mt-5" aria-label={`Step ${step + 1} of ${steps.length}`}><div className="flex gap-1">{steps.map((s, i) => <div key={s} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />)}</div><p className="mt-2 text-sm text-muted-foreground">Step {step + 1} of {steps.length}: {steps[step]}</p></div>
    <section className="surface mt-6 space-y-5 p-6">
      {step === 0 && <><div className="max-h-80 space-y-5 overflow-y-auto rounded-lg border border-border p-4 text-sm leading-6"><p className="text-xs text-muted-foreground">Privacy Notice version {PRIVACY_NOTICE_VERSION} (draft)</p><PrivacyContent /></div><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><span>I have read and agree to the <Link to="/privacy" target="_blank" className="text-primary underline">Privacy Notice</Link> and <Link to="/terms" target="_blank" className="text-primary underline">Terms</Link>.</span></label>{errors["agree"] && <p className="text-xs text-destructive">{errors["agree"]}</p>}</>}
      {step === 1 && <>{['first_name', 'middle_name', 'last_name'].map(k => field(k))}<label className="block text-sm font-medium">Sex<select value={values["sex"]} onChange={e => set('sex', e.target.value)} className={inputCls}><option value="">Select…</option><option value="male">Male</option><option value="female">Female</option></select>{errors["sex"] && <span className="mt-1 block text-xs text-destructive">{errors["sex"]}</span>}</label>{field('birthdate', 'date')}{field('contact_number', 'tel')}{field('email', 'email')}</>}
      {step === 2 && <>{['home_address', 'municipality', 'student_id', 'college_program'].map(k => field(k))}<label className="block text-sm font-medium">Year level<select value={values["year_level"]} onChange={e => set('year_level', e.target.value)} className={inputCls}><option value="">Select…</option>{['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map(y => <option key={y}>{y}</option>)}</select>{errors["year_level"] && <span className="mt-1 block text-xs text-destructive">{errors["year_level"]}</span>}</label></>}
      {step === 3 && <><h2 className="font-semibold">Parent or guardian</h2>{field('guardian_name')}{field('guardian_relationship')}{field('guardian_contact', 'tel')}{field('guardian_email', 'email')}<p className="text-xs text-muted-foreground">The parental consent form will be sent to this email.</p><h2 className="pt-3 font-semibold">Emergency contact</h2>{field('emergency_name')}{field('emergency_relationship')}{field('emergency_contact', 'tel')}</>}
      {step === 4 && field('preferred_building')}
      {step === 5 && <>{fileField('load_slip', 'Load slip / certificate of registration (required)')}{fileField('school_id', 'School ID or valid ID (optional)')}<p className="text-xs text-muted-foreground">PDF, JPG, or PNG, up to 5 MB each. The notarized parental consent is uploaded after you submit.</p></>}
      {step === 6 && <><dl className="grid gap-3 text-sm sm:grid-cols-2">{Object.keys(empty).map(k => <div key={k}><dt className="text-xs text-muted-foreground">{(labels[k] ?? k).replace(' (optional)', '')}</dt><dd className="break-words font-medium">{values[k] || '—'}</dd></div>)}<div><dt className="text-xs text-muted-foreground">Load slip</dt><dd className="font-medium">{files.load_slip?.name}</dd></div><div><dt className="text-xs text-muted-foreground">School ID</dt><dd className="font-medium">{files.school_id?.name ?? '—'}</dd></div></dl>{submitError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-destructive">{submitError}</p>}</>}
    </section>
    <div className="mt-6 flex justify-between gap-3">
      <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>
      {step < 6 ? <Button onClick={next}>Continue<ArrowRight /></Button> : <Button disabled={busy} onClick={submit}>{busy ? <LoaderCircle className="animate-spin" /> : <>Submit application<ArrowRight /></>}</Button>}
    </div>
  </div>
}
