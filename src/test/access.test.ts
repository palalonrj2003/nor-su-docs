import { describe, expect, it } from 'vitest'
import { homeForRoles, canAccessAdminPage } from '@/lib/access'
describe('MVP account access', () => {
 it('routes students to their own application', () => expect(homeForRoles(['student'])).toBe('/my-application'))
 it('routes admins to the admin area', () => expect(homeForRoles(['admin'])).toBe('/admin'))
 it('routes staff to the admin area', () => expect(homeForRoles(['staff'])).toBe('/admin'))
 it('denies staff application access', () => expect(canAccessAdminPage(['staff'], 'applications')).toBe(false))
 it('denies staff consent document access', () => expect(canAccessAdminPage(['staff'], 'consent-review')).toBe(false))
 it('allows staff resident masterlist access', () => expect(canAccessAdminPage(['staff'], 'residents')).toBe(true))
 it('allows staff room availability access', () => expect(canAccessAdminPage(['staff'], 'rooms')).toBe(true))
 it('denies staff account management', () => expect(canAccessAdminPage(['staff'], 'staff')).toBe(false))
 it('allows admin full access', () => expect(canAccessAdminPage(['admin'], 'settings')).toBe(true))
})
