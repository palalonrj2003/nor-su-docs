import { describe, expect, it } from 'vitest'
import { validateFile, isPeriodOpen, stepSchemas } from '@/lib/application'

const file = (type: string, size: number) => ({ type, size }) as File

describe('application rules', () => {
  it('requires the load slip', () => expect(validateFile(null, true)).toBe('This document is required.'))
  it('allows the school ID to be skipped', () => expect(validateFile(null, false)).toBeNull())
  it('accepts PDF, JPG and PNG', () => ['application/pdf', 'image/jpeg', 'image/png'].forEach(t => expect(validateFile(file(t, 1000), true)).toBeNull()))
  it('rejects other file types', () => expect(validateFile(file('image/gif', 1000), true)).toBe('Use a PDF, JPG, or PNG file.'))
  it('rejects files over 5 MB', () => expect(validateFile(file('application/pdf', 5 * 1024 * 1024 + 1), true)).toBe('File must be 5 MB or smaller.'))
  it('accepts exactly 5 MB', () => expect(validateFile(file('application/pdf', 5 * 1024 * 1024), true)).toBeNull())
  it('is open only while active and within dates', () => {
    const now = new Date('2026-06-15T00:00:00Z')
    const p = { opens_at: '2026-06-01T00:00:00Z', closes_at: '2026-06-30T00:00:00Z', is_active: true }
    expect(isPeriodOpen(p, now)).toBe(true)
    expect(isPeriodOpen({ ...p, is_active: false }, now)).toBe(false)
    expect(isPeriodOpen(p, new Date('2026-07-01T00:00:00Z'))).toBe(false)
    expect(isPeriodOpen(null, now)).toBe(false)
  })
  it('requires a guardian email', () => {
    const r = stepSchemas[3].safeParse({ guardian_name: 'A', guardian_relationship: 'Mother', guardian_contact: '09171234567', guardian_email: '', emergency_name: 'B', emergency_relationship: 'Aunt', emergency_contact: '09171234567' })
    expect(r.success).toBe(false)
  })
})
