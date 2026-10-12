export type AppRole = 'student' | 'admin' | 'staff'
export function homeForRoles(roles: readonly AppRole[]) {
  return roles.includes('admin') || roles.includes('staff') ? '/admin' : '/my-application'
}
export function canAccessAdminPage(roles: readonly AppRole[], page: string) {
  return roles.includes('admin') || (roles.includes('staff') && ['dashboard', 'rooms', 'residents'].includes(page))
}