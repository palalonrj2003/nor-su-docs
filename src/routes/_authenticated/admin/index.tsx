import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, BedDouble, ClipboardList, FileText, ShieldCheck, Users } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Calendar } from '@/components/ui/calendar'
import { PageTitle } from '@/components/page-title'
import { StatusBadge } from '@/components/status-badge'
import { pageHead } from '@/lib/metadata'
import { applicationsOverTime, daysLeft, fullName, initialsOf, loadActivePeriod, loadAdminApplications } from '@/lib/admin'

export const Route = createFileRoute('/_authenticated/admin/')({
  head: () => pageHead('Dashboard', 'NORSU BSC dormitory applications and occupancy at a glance.'),
  component: Dashboard,
})

function Stat({ label, value, icon: Icon, note }: { label: string; value: string | number; icon: typeof Users; note?: string }) {
  return <div className="surface p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="rounded-full bg-accent p-2 text-primary"><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-3xl font-semibold">{value}</p>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</div>
}

function Dashboard() {
  const { identity } = Route.useRouteContext()
  const isAdmin = identity.roles.includes('admin')
  const apps = useQuery({ queryKey: ['admin-applications'], queryFn: loadAdminApplications, enabled: isAdmin })
  const period = useQuery({ queryKey: ['active-period'], queryFn: loadActivePeriod })
  const rows = apps.data ?? []
  const pending = rows.filter(r => r.status === 'submitted' || r.status === 'under_review').length
  const consent = rows.filter(r => r.consent_status === 'received').length
  const closes = period.data ? new Date(period.data.closes_at) : null
  const alerts = [
    consent > 0 && `${consent} consent form${consent === 1 ? '' : 's'} waiting for verification`,
    rows.filter(r => !r.has_load_slip).length > 0 && `${rows.filter(r => !r.has_load_slip).length} application(s) missing a load slip`,
    closes && closes > new Date() && daysLeft(period.data!.closes_at) <= 7 && `Application period closes in ${daysLeft(period.data!.closes_at)} day(s)`,
  ].filter(Boolean) as string[]
  const tasks = [
    consent > 0 && { text: `Verify ${consent} consent form(s)`, to: '/admin/consent-review' as const },
    rows.filter(r => r.status === 'submitted').length > 0 && { text: `Start review of ${rows.filter(r => r.status === 'submitted').length} new application(s)`, to: '/admin/applications' as const },
  ].filter(Boolean) as { text: string; to: '/admin/consent-review' | '/admin/applications' }[]

  return <>
    <PageTitle title="Dashboard" subtitle="NORSU BSC dormitory at a glance." />
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <Stat label="Total Residents" value={0} icon={Users} note="Bed assignments come next" />
          {isAdmin && <Stat label="Pending Applications" value={pending} icon={FileText} />}
          {isAdmin && <Stat label="Consent to Verify" value={consent} icon={ShieldCheck} />}
          <Stat label="Available Beds" value="—" icon={BedDouble} note="Rooms not set up yet" />
        </div>
        {isAdmin && <section className="surface p-5"><h2 className="mb-4 font-semibold">Applications over time</h2><div className="h-64"><ResponsiveContainer><LineChart data={applicationsOverTime(rows)}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tickFormatter={d => d.slice(5)} fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend /><Line type="monotone" dataKey="submitted" name="Submitted" stroke="var(--primary)" strokeWidth={2} /><Line type="monotone" dataKey="approved" name="Approved" stroke="var(--success)" strokeWidth={2} /></LineChart></ResponsiveContainer></div></section>}
        <section className="surface p-5"><h2 className="mb-2 font-semibold">Bed occupancy per floor</h2><p className="py-10 text-center text-sm text-muted-foreground">Occupancy will show here once rooms and beds are added.</p></section>
        {isAdmin && <section className="surface p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent applications</h2><Link to="/admin/applications" className="text-sm text-primary">View all</Link></div>
          {!rows.length && <p className="text-sm text-muted-foreground">No applications yet.</p>}
          <ul className="divide-y divide-border">{rows.slice(0, 5).map(r => <li key={r.id} className="flex items-center gap-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">{initialsOf(r)}</span><div className="min-w-0 flex-1"><Link to="/admin/applications/$id" params={{ id: r.id }} className="font-medium hover:underline">{fullName(r)}</Link><p className="text-xs text-muted-foreground">{r.college_program} · {new Date(r.submitted_at).toLocaleDateString()}</p></div><StatusBadge value={r.status} /></li>)}</ul></section>}
      </div>
      <aside className="space-y-6">
        <section className="surface p-5"><h2 className="mb-3 font-semibold">Bed occupancy</h2><p className="text-3xl font-semibold">—</p><p className="text-xs text-muted-foreground">Available after rooms are set up.</p></section>
        {isAdmin && <section className="surface p-5"><h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-warning" />Alerts & Notifications</h2>{alerts.length ? <ul className="space-y-2 text-sm">{alerts.map(a => <li key={a} className="rounded-lg bg-warning-soft p-3 text-warning">{a}</li>)}</ul> : <p className="text-sm text-muted-foreground">You're all caught up.</p>}</section>}
        <section className="surface p-3"><Calendar mode="single" selected={new Date()} modifiers={closes ? { close: closes } : {}} modifiersClassNames={{ close: 'bg-danger-soft text-destructive font-semibold rounded-md' }} className="mx-auto" /><p className="px-2 pb-2 text-xs text-muted-foreground">{closes ? `Applications close ${closes.toLocaleDateString()}` : 'No active application period'}</p></section>
        {isAdmin && <section className="surface p-5"><h2 className="mb-3 flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary" />Upcoming tasks</h2>{tasks.length ? <ul className="space-y-2 text-sm">{tasks.map(t => <li key={t.text}><Link to={t.to} className="text-primary hover:underline">{t.text}</Link></li>)}</ul> : <p className="text-sm text-muted-foreground">No tasks right now.</p>}</section>}
      </aside>
    </div>
  </>
}
