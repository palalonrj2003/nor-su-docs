import { useState } from 'react'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, FileText, ShieldCheck, BedDouble, Users, UserRoundCog, Settings, LogOut, Search, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Brand } from './brand'
import { getIdentity } from '@/lib/identity'
import { canAccessAdminPage } from '@/lib/access'
import { supabase } from '@/integrations/supabase/client'
const items = [
  { title: 'Dashboard', to: '/admin', page: 'dashboard', icon: LayoutDashboard },
  { title: 'Applications', to: '/admin/applications', page: 'applications', icon: FileText },
  { title: 'Consent Review', to: '/admin/consent-review', page: 'consent-review', icon: ShieldCheck },
  { title: 'Rooms & Beds', to: '/admin/rooms', page: 'rooms', icon: BedDouble },
  { title: 'Residents', to: '/admin/residents', page: 'residents', icon: Users },
  { title: 'Staff', to: '/admin/staff', page: 'staff', icon: UserRoundCog },
  { title: 'Settings', to: '/admin/settings', page: 'settings', icon: Settings },
] as const
export function DormShell({ student = false }: { student?: boolean }) {
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [search, setSearch] = useState('')
  const { data: identity } = useQuery({ queryKey: ['identity'], queryFn: getIdentity })
  const path = useRouterState({ select: s => s.location.pathname })
  const client = useQueryClient(); const navigate = useNavigate()
  const name = identity?.name ?? 'Account'
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  async function signOut() { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', replace: true }) }
  if (student) return <div className="min-h-screen"><header className="border-b border-border bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5"><Brand /><Button variant="outline" onClick={signOut}><LogOut />Sign out</Button></div></header><main className="mx-auto max-w-5xl px-6 py-10"><Outlet /></main></div>
  return <div className="flex min-h-screen gap-5 p-4 md:p-5">
    <aside className={`surface sticky top-5 flex h-[calc(100vh-40px)] shrink-0 flex-col p-3 ${collapsed ? 'w-[72px]' : 'w-[240px]'} max-md:hidden`}>
      <div className="px-1 py-3">{collapsed ? <div className="text-center text-lg font-bold text-primary">BN</div> : <Brand />}</div><nav className="mt-7 flex flex-col gap-2">{items.filter(i => canAccessAdminPage(identity?.roles ?? [], i.page)).map(i => <Button key={i.to} asChild variant={path === i.to ? 'default' : 'outline'} className={`h-11 ${collapsed ? 'px-0' : 'justify-start bg-card'} ${path === i.to ? 'bg-primary' : ''}`} title={i.title}><Link to={i.to}><i.icon />{!collapsed && i.title}</Link></Button>)}</nav>
      <div className="mt-auto"><div className="mb-4 flex items-center gap-3 overflow-hidden"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</span>{!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-muted-foreground">{identity?.roles.includes('admin') ? 'Dorm Supervisor' : 'Dormitory Staff'}</p></div>}</div><Button variant="outline" className="w-full text-destructive" onClick={signOut} title="Sign out"><LogOut />{!collapsed && 'Sign out'}</Button></div>
    </aside>
    <div className="min-w-0 flex-1"><header className="mb-7 flex h-12 items-center gap-3"><Button variant="ghost" size="icon" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label="Toggle sidebar" onClick={() => setCollapsed(!collapsed)} className="max-md:hidden">{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button><div className="relative flex-1 max-md:hidden"><Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" /><input aria-label="Search pages" placeholder="Search pages…" maxLength={100} value={search} onChange={e => setSearch(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" />{search && <div className="surface absolute top-12 z-20 w-full p-2">{items.filter(i => canAccessAdminPage(identity?.roles ?? [], i.page) && i.title.toLowerCase().includes(search.toLowerCase())).map(i => <Button key={i.to} variant="ghost" className="w-full justify-start" onClick={() => { setSearch(''); void navigate({ to: i.to }) }}><i.icon />{i.title}</Button>)}{!items.some(i => canAccessAdminPage(identity?.roles ?? [], i.page) && i.title.toLowerCase().includes(search.toLowerCase())) && <p className="p-3 text-sm text-muted-foreground">No matching pages.</p>}</div>}</div><div className="md:hidden"><Brand /></div><div className="relative ml-auto"><Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications" onClick={() => setNotifications(!notifications)}><Bell /></Button>{notifications && <div className="surface absolute right-0 top-12 z-20 w-64 p-5"><p className="text-sm font-semibold">Notifications</p><p className="mt-3 text-sm text-muted-foreground">You're all caught up.</p></div>}</div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</span><Button className="md:hidden" variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}><LogOut /></Button></header>
      <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden">{items.filter(i => canAccessAdminPage(identity?.roles ?? [], i.page)).map(i => <Button asChild key={i.to} variant={path === i.to ? 'default' : 'outline'} className="shrink-0"><Link to={i.to}><i.icon />{i.title}</Link></Button>)}</nav><Outlet />
    </div>
  </div>
}