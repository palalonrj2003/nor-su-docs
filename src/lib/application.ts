import { z } from 'zod'

export const PRIVACY_NOTICE_VERSION = '1.0'
export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

const text = (label: string, max: number) => z.string().trim().min(1, `Enter ${label}.`).max(max, `${label} is too long.`)
const phone = (label: string) => z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, `Enter a valid ${label}.`)

export const stepSchemas = [
  z.object({}),
  z.object({
    first_name: text('your first name', 80), middle_name: z.string().trim().max(80), last_name: text('your last name', 80),
    sex: z.enum(['male', 'female'], { message: 'Select your sex.' }),
    birthdate: z.string().refine(v => !Number.isNaN(Date.parse(v)) && new Date(v) < new Date(), 'Enter a valid birthdate.'),
    contact_number: phone('contact number'), email: z.string().trim().email('Enter a valid email address.').max(255),
  }),
  z.object({
    home_address: text('your home address', 300), municipality: text('your municipality', 100),
    student_id: text('your student ID', 40), college_program: text('your college/program', 150), year_level: text('your year level', 20),
  }),
  z.object({
    guardian_name: text("your guardian's name", 150), guardian_relationship: text('the relationship', 60),
    guardian_contact: phone("guardian's contact number"), guardian_email: z.string().trim().email("Enter a valid guardian email.").max(255),
    emergency_name: text('an emergency contact name', 150), emergency_relationship: text('the emergency relationship', 60),
    emergency_contact: phone('emergency contact number'),
  }),
  z.object({ preferred_building: z.string().trim().max(150) }),
] as const

export function validateFile(file: File | null | undefined, required: boolean): string | null {
  if (!file) return required ? 'This document is required.' : null
  if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(file.type)) return 'Use a PDF, JPG, or PNG file.'
  if (file.size > MAX_FILE_BYTES) return 'File must be 5 MB or smaller.'
  return null
}

export function isPeriodOpen(p: { opens_at: string; closes_at: string; is_active: boolean } | null | undefined, now = new Date()) {
  return !!p && p.is_active && new Date(p.opens_at) <= now && now <= new Date(p.closes_at)
}
