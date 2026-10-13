import { createFileRoute, redirect } from '@tanstack/react-router'
import { DormShell } from '@/components/dorm-shell'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/my-application')({
  beforeLoad: ({ context }) => { if (context.identity.roles.some(r => r === 'admin' || r === 'staff')) throw redirect({ to: '/admin' }) },
  head: () => pageHead('My application', 'Your private NORSU BSC dormitory application and status.'),
  component: () => <StudentPage />,
})
function StudentPage() {
  const { data } = useQuery({ queryKey: ['my-applications'], queryFn: async () => { const { data, error } = await supabase.from('applications').select('id,submitted_at').order('submitted_at', { ascending: false }).limit(1); if (error) throw error; return data } })
  const latest = data?.[0]
  return <div><header className="border-b border-border bg-card p-5"><StudentHeader /></header><main className="mx-auto max-w-4xl px-6 py-10">{latest ? <div className="surface p-8"><h1 className="text-2xl font-semibold">Application submitted</h1><p className="mt-2 text-sm text-muted-foreground">Submitted on {new Date(latest.submitted_at).toLocaleDateString()}. Your status will appear here.</p></div> : <><EmptyPage kind="student" title="My application" subtitle="Your NORSU BSC dormitory application." /><div className="mt-6 flex justify-center"><Button asChild><Link to="/apply">Start your application</Link></Button></div></>}</main></div>
}
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
function StudentHeader() { const client = useQueryClient(); const navigate = useNavigate(); return <div className="mx-auto flex max-w-4xl items-center justify-between gap-3"><Brand /><Button variant="outline" onClick={async () => { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', replace: true }) }}><LogOut />Sign out</Button></div> }