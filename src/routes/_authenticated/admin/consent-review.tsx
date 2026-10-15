import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/page-title'
import { StatusBadge } from '@/components/status-badge'
import { pageHead } from '@/lib/metadata'
import { fullName, initialsOf, loadAdminApplications } from '@/lib/admin'

export const Route = createFileRoute('/_authenticated/admin/consent-review')({
  beforeLoad: ({ context }) => { if (!context.identity.roles.includes('admin')) throw redirect({ to: '/admin' }) },
  head: () => pageHead('Consent Review', 'Notarized parental consent verification.'),
  component: ConsentReview,
})

function ConsentReview() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-applications'], queryFn: loadAdminApplications })
  const queue = (data ?? []).filter(a => a.consent_status === 'received').sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
  return <>
    <PageTitle title="Consent Review" subtitle="Notarized parental consent forms waiting for verification." />
    {isLoading && <p className="text-muted-foreground">Loading…</p>}
    {error && <p className="text-destructive">{error.message}</p>}
    {!isLoading && !queue.length && !error && <div className="flex min-h-[300px] flex-col items-center justify-center border-y border-border text-center"><span className="mb-4 rounded-full bg-accent p-5 text-primary"><ShieldCheck className="h-8 w-8" /></span><h2 className="text-lg font-semibold">No consent forms to verify</h2><p className="mt-1 text-sm text-muted-foreground">Uploaded forms will appear here.</p></div>}
    <div className="grid gap-3">{queue.map(a => <div key={a.id} className="surface flex flex-wrap items-center gap-4 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">{initialsOf(a)}</span>
      <div className="min-w-0 flex-1"><p className="font-semibold">{fullName(a)}</p><p className="text-xs text-muted-foreground">{a.student_id} · {a.college_program} · Guardian: {a.guardian_name}</p></div>
      <StatusBadge value={a.consent_status} /><StatusBadge value={a.status} />
      <Button asChild size="sm"><Link to="/admin/applications/$id" params={{ id: a.id }}>Review consent</Link></Button>
    </div>)}</div>
  </>
}
