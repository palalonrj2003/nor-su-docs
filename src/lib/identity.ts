import { supabase } from '@/integrations/supabase/client'
import type { AppRole } from './access'
export async function getIdentity() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: roles, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
  if (roleError) throw new Error('Your account permissions could not be loaded. Please try again.')
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  return { user, roles: (roles ?? []).map(r => r.role) as AppRole[], name: profile?.full_name || user.email || 'Account' }
}