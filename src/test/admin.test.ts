import { describe, expect, it } from 'vitest'
import { applicationsOverTime, countByStatus, daysLeft, filterApplications, toCsv, type AppListItem } from '@/lib/admin'

const base = { middle_name: '', college_program: 'BSIT', year_level: '1st Year', consent_status: 'pending', status: 'submitted', reviewed_at: null, has_load_slip: true } as const
const rows = [
  { ...base, id: '1', first_name: 'Ana', last_name: 'Cruz', student_id: '2024-001', submitted_at: '2026-10-01T00:00:00Z' },
  { ...base, id: '2', first_name: 'Ben', last_name: 'Reyes', student_id: '2024-002', submitted_at: '2026-10-02T00:00:00Z', status: 'approved', consent_status: 'verified', reviewed_at: '2026-10-03T00:00:00Z' },
] as unknown as AppListItem[]
const f = { tab: 'all', search: '', college: '', year: '', consent: '', sort: 'newest' } as const

describe('admin applications', () => {
  it('filters by status tab', () => expect(filterApplications(rows, { ...f, tab: 'approved' }).map(r => r.id)).toEqual(['2']))
  it('searches by student ID', () => expect(filterApplications(rows, { ...f, search: '2024-001' }).map(r => r.id)).toEqual(['1']))
  it('sorts newest first', () => expect(filterApplications(rows, f).map(r => r.id)).toEqual(['2', '1']))
  it('counts per status', () => expect(countByStatus(rows)).toMatchObject({ all: 2, submitted: 1, approved: 1 }))
  it('days left rounds up', () => expect(daysLeft('2026-10-05T12:00:00Z', new Date('2026-10-04T00:00:00Z'))).toBe(2))
  it('CSV neutralises formula cells', () => expect(toCsv([{ ...rows[0], first_name: '=cmd' } as AppListItem])).toContain("'=cmd"))
  it('charts approvals on review date', () => {
    const d = applicationsOverTime(rows, 5, new Date('2026-10-03T12:00:00Z'))
    expect(d.find(x => x.date === '2026-10-03')?.approved).toBe(1)
  })
})
