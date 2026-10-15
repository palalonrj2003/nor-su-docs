import { useMemo, useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/page-title'
import { StatusBadge } from '@/components/status-badge'
import { pageHead } from '@/lib/metadata'
import { STATUS_TABS, countByStatus, daysLeft, filterApplications, fullName, initialsOf, loadActivePeriod, loadAdminApplications, statusLabels, toCsv, type ListFilters } from '@/lib/admin'

export const Route = createFileRoute('/_authenticated/admin/applications/')({
  beforeLoad: ({ context }) => { if (!context.identity.roles.includes('admin')) throw redirect({ to: '/admin' }) },
  head: () => pageHead('Applications', 'Review student dormitory applications.'),
  component: ApplicationsPage,
})

const PAGE_SIZE = 10
const fmt = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
const selectCls = 'h-10 rounded-xl border border-input bg-card px-3 text-sm'

function ApplicationsPage() {
  const apps = useQuery({ queryKey: ['admin-applications'], queryFn: loadAdminApplications })
  const period = useQuery({ queryKey: ['active-period'], queryFn: loadActivePeriod })
  const [f, setF] = useState<ListFilters>({ tab: 'all', search: '', college: '', year: '', consent: '', sort: 'newest' })
  const [page, setPage] = useState(1)
  const rows = apps.data ?? []
  const counts = countByStatus(rows)
  const filtered = useMemo(() => filterApplications(rows, f), [rows, f])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const colleges = [...new Set(rows.map(r => r.college_program))].sort()
  const years = [...new Set(rows.map(r => r.year_level))].sort()
  const set = (p: Partial<ListFilters>) => { setF({ ...f, ...p }); setPage(1) }
  const p = period.data
  const open = p && new Date(p.opens_at) <= new Date() && new Date(p.closes_at) > new Date()

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }

  return <>
    <PageTitle title="Applications" subtitle="Review student dormitory applications." actions={<Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download />Export List</Button>} />
    <div className="surface mb-6 flex flex-wrap items-center gap-4 p-5">
      <span className="rounded-full bg-accent p-3 text-primary"><CalendarClock className="h-5 w-5" /></span>
      <div className="flex-1">{p ? <><p className="font-semibold">{open ? 'Application period is open' : 'Application period is closed'}</p><p className="text-sm text-muted-foreground">{p.name}: {fmt(p.opens_at)} – {fmt(p.closes_at)}{open && ` · ${daysLeft(p.closes_at)} days left`}</p></> : <p className="font-semibold">No active application period</p>}</div>
      <Button asChild variant="outline"><Link to="/admin/settings">Manage Period</Link></Button>
    </div>
    <div className="mb-4 flex gap-2 overflow-x-auto">{STATUS_TABS.map(t => <Button key={t} size="sm" variant={f.tab === t ? 'default' : 'outline'} onClick={() => set({ tab: t })}>{statusLabels[t]} <span className="ml-1 rounded-full bg-background/20 px-2 text-xs">{counts[t]}</span></Button>)}</div>
    <div className="mb-4 flex flex-wrap gap-3">
      <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input aria-label="Search applicants" placeholder="Search name or student ID" maxLength={100} value={f.search} onChange={e => set({ search: e.target.value })} className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm" /></div>
      <select aria-label="College" className={selectCls} value={f.college} onChange={e => set({ college: e.target.value })}><option value="">All programs</option>{colleges.map(c => <option key={c}>{c}</option>)}</select>
      <select aria-label="Year level" className={selectCls} value={f.year} onChange={e => set({ year: e.target.value })}><option value="">All years</option>{years.map(c => <option key={c}>{c}</option>)}</select>
      <select aria-label="Consent status" className={selectCls} value={f.consent} onChange={e => set({ consent: e.target.value })}><option value="">Any consent</option>{['pending', 'received', 'verified', 'rejected'].map(c => <option key={c} value={c}>{statusLabels[c]}</option>)}</select>
      <select aria-label="Sort" className={selectCls} value={f.sort} onChange={e => set({ sort: e.target.value as ListFilters['sort'] })}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select>
    </div>
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="border-b border-border text-left text-xs text-muted-foreground"><tr>{['Applicant', 'Program', 'Year', 'Submitted', 'Load slip', 'Consent', 'Status', ''].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>
          {apps.isLoading && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading applications…</td></tr>}
          {apps.error && <tr><td colSpan={8} className="p-8 text-center text-destructive">{apps.error.message}</td></tr>}
          {!apps.isLoading && !shown.length && !apps.error && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No applications match.</td></tr>}
          {shown.map(r => <tr key={r.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">{initialsOf(r)}</span><div><p className="font-semibold">{fullName(r)}</p><p className="text-xs text-muted-foreground">{r.student_id}</p></div></div></td>
            <td className="px-4 py-3">{r.college_program}</td><td className="px-4 py-3">{r.year_level}</td><td className="px-4 py-3">{fmt(r.submitted_at)}</td>
            <td className="px-4 py-3">{r.has_load_slip ? <span className="text-success">Uploaded</span> : <span className="text-destructive">Missing</span>}</td>
            <td className="px-4 py-3"><StatusBadge value={r.consent_status} /></td><td className="px-4 py-3"><StatusBadge value={r.status} /></td>
            <td className="px-4 py-3 text-right"><Button asChild size="sm" variant="outline"><Link to="/admin/applications/$id" params={{ id: r.id }}>Review</Link></Button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>{filtered.length} application{filtered.length === 1 ? '' : 's'}</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pages}</span><Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></div></div>
  </>
}
