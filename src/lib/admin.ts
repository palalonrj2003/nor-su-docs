import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

export type ApplicationRow = Database['public']['Tables']['applications']['Row']
export type AppListItem = ApplicationRow & { has_load_slip: boolean }

export const STATUS_TABS = ['all', 'submitted', 'under_review', 'approved', 'waitlisted', 'rejected'] as const
export type StatusTab = (typeof STATUS_TABS)[number]

export const statusLabels: Record<string, string> = {
  all: 'All', submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', waitlisted: 'Waitlisted', rejected: 'Rejected',
  pending: 'Pending', received: 'Received', verified: 'Verified',
}
export const statusStyles: Record<string, string> = {
  submitted: 'bg-azure-soft text-primary', under_review: 'bg-azure-soft text-primary', received: 'bg-azure-soft text-primary',
  approved: 'bg-success-soft text-success', verified: 'bg-success-soft text-success',
  waitlisted: 'bg-warning-soft text-warning', pending: 'bg-warning-soft text-warning',
  rejected: 'bg-danger-soft text-destructive',
}

export function fullName(a: Pick<ApplicationRow, 'first_name' | 'middle_name' | 'last_name'>) {
  return [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' ')
}
export function initialsOf(a: Pick<ApplicationRow, 'first_name' | 'last_name'>) {
  return `${a.first_name[0] ?? ''}${a.last_name[0] ?? ''}`.toUpperCase()
}

export type ListFilters = { tab: StatusTab; search: string; college: string; year: string; consent: string; sort: 'newest' | 'oldest' | 'name' }

export function filterApplications<T extends ApplicationRow>(rows: T[], f: ListFilters): T[] {
  const q = f.search.trim().toLowerCase()
  const out = rows.filter(r =>
    (f.tab === 'all' || r.status === f.tab) &&
    (!q || fullName(r).toLowerCase().includes(q) || r.student_id.toLowerCase().includes(q)) &&
    (!f.college || r.college_program === f.college) &&
    (!f.year || r.year_level === f.year) &&
    (!f.consent || r.consent_status === f.consent))
  return out.sort((a, b) => f.sort === 'name'
    ? fullName(a).localeCompare(fullName(b))
    : f.sort === 'oldest' ? a.submitted_at.localeCompare(b.submitted_at) : b.submitted_at.localeCompare(a.submitted_at))
}

export function countByStatus(rows: Pick<ApplicationRow, 'status'>[]) {
  const counts: Record<StatusTab, number> = { all: rows.length, submitted: 0, under_review: 0, approved: 0, waitlisted: 0, rejected: 0 }
  for (const r of rows) counts[r.status as StatusTab]++
  return counts
}

export function daysLeft(closesAt: string, now = new Date()) {
  return Math.max(0, Math.ceil((new Date(closesAt).getTime() - now.getTime()) / 86_400_000))
}

function csvCell(v: unknown) {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@]/.test(s)) s = `'${s}` // block spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export function toCsv(rows: AppListItem[]) {
  const head = ['Student ID', 'Name', 'Program', 'Year', 'Submitted', 'Load slip', 'Consent', 'Status']
  const body = rows.map(r => [r.student_id, fullName(r), r.college_program, r.year_level, r.submitted_at.slice(0, 10), r.has_load_slip ? 'Uploaded' : 'Missing', statusLabels[r.consent_status], statusLabels[r.status]])
  return [head, ...body].map(line => line.map(csvCell).join(',')).join('\n')
}

/** Applications per day for the last `days` days: submitted (by submitted_at) vs approved (by reviewed_at). */
export function applicationsOverTime(rows: Pick<ApplicationRow, 'submitted_at' | 'status' | 'reviewed_at'>[], days = 14, now = new Date()) {
  const out: { date: string; submitted: number; approved: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    out.push({ date: d.toISOString().slice(0, 10), submitted: 0, approved: 0 })
  }
  const idx = new Map(out.map((o, i) => [o.date, i]))
  for (const r of rows) {
    const s = idx.get(r.submitted_at.slice(0, 10)); if (s !== undefined) out[s]!.submitted++
    if (r.status === 'approved' && r.reviewed_at) { const a = idx.get(r.reviewed_at.slice(0, 10)); if (a !== undefined) out[a]!.approved++ }
  }
  return out
}

export async function logAudit(action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('audit_logs').insert({ actor_id: user.id, action, entity_type: entityType, entity_id: entityId, metadata: metadata as never })
}

export async function loadAdminApplications(): Promise<AppListItem[]> {
  const { data, error } = await supabase.from('applications').select('*, application_documents(type)').order('submitted_at', { ascending: false })
  if (error) throw new Error('Applications could not be loaded. Please try again.')
  return (data ?? []).map(({ application_documents, ...a }) => ({ ...a, has_load_slip: (application_documents ?? []).some(d => d.type === 'load_slip') }))
}

export async function loadActivePeriod() {
  const { data } = await supabase.from('application_periods').select('*').eq('is_active', true).order('opens_at', { ascending: false }).limit(1)
  return data?.[0] ?? null
}
