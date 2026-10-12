import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Mail, Home, LoaderCircle, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Brand } from './brand'
import { getIdentity } from '@/lib/identity'
import { homeForRoles } from '@/lib/access'

const schema = z.object({ email: z.string().trim().email('Enter a valid email address.').max(255), password: z.string().min(8, 'Use at least 8 characters.').max(128) })
export function AuthPage() {
  const navigate = useNavigate()
  const { data: identity } = useQuery({ queryKey: ['identity'], queryFn: getIdentity, retry: false })
  const [register, setRegister] = useState(false)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    const values = new FormData(event.currentTarget)
    const result = schema.safeParse({ email: values.get('email'), password: values.get('password') })
    const name = z.string().trim().min(2, 'Enter your full name.').max(150).safeParse(values.get('name'))
    if (!result.success) { setError(result.error.issues[0]?.message ?? 'Check your details.'); return }
    if (register && !name.success) { setError('Enter your full name (2–150 characters).'); return }
    setBusy(true)
    try {
      if (register) {
        const { error: authError } = await supabase.auth.signUp({ ...result.data, options: { emailRedirectTo: window.location.origin, data: { full_name: name.success ? name.data : '' } } })
        if (authError) throw authError
        setConfirmed(true)
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword(result.data)
        if (authError) throw authError
        const current = await getIdentity()
        if (!current) throw new Error('Please confirm your email before signing in.')
        await navigate({ to: homeForRoles(current.roles) })
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.') }
    finally { setBusy(false) }
  }
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Brand /><span className="hidden text-sm text-muted-foreground sm:block">Negros Oriental State University · BSC Campus</span><ShieldCheck className="h-5 w-5 text-primary sm:hidden" /></div></header>
    <main className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-20">
      <section className="flex flex-col justify-center"><span className="mb-5 flex items-center gap-2 text-sm font-medium text-primary"><Home className="h-4 w-4" /> YOUR CAMPUS HOME</span><h1 className="text-4xl font-bold leading-tight sm:text-5xl">Balay NORSU</h1><p className="mt-5 max-w-md text-xl leading-relaxed text-muted-foreground">A place to belong.<br />A home for your university journey.</p><div className="mt-10 border-l-4 border-primary pl-5"><p className="text-sm font-semibold">NORSU BSC Dormitory</p><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Student housing at Negros Oriental State University, Bais City Campus.</p></div><div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 text-primary" />Your information stays private and protected.</div></section>
      <section className="surface p-7 sm:p-9">
        {identity ? <><span className="mb-5 inline-flex rounded-full bg-success-soft p-3 text-success"><CheckCircle2 /></span><h2 className="text-2xl font-semibold">Welcome back</h2><p className="mt-3 break-words text-muted-foreground">{identity.name}</p><Button className="mt-7 w-full" onClick={() => navigate({ to: homeForRoles(identity.roles) })}>Continue to your account<ArrowRight /></Button></> : confirmed ? <><Mail className="mb-5 h-10 w-10 text-primary" /><h2 className="text-2xl font-semibold">Check your email</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">We sent a confirmation link to your email address. Confirm your email before signing in.</p><Button className="mt-7 w-full" onClick={() => { setConfirmed(false); setRegister(false) }}>Back to sign in<ArrowRight /></Button></> : <><h2 className="text-2xl font-semibold">{register ? 'Create your account' : 'Welcome home'}</h2><p className="mt-2 text-sm text-muted-foreground">{register ? 'Start your Balay NORSU journey.' : 'Sign in to your Balay NORSU account.'}</p><div className="mt-7 grid grid-cols-2 rounded-lg bg-muted p-1"><Button variant={register ? 'ghost' : 'secondary'} onClick={() => { setRegister(false); setError('') }}>Sign in</Button><Button variant={register ? 'secondary' : 'ghost'} onClick={() => { setRegister(true); setError('') }}>Create account</Button></div><form className="mt-7 space-y-5" onSubmit={submit}>
          {register && <label className="block text-sm font-medium">Full name<input name="name" autoComplete="name" maxLength={150} required className="mt-2 h-12 w-full rounded-lg border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" placeholder="Your full name" /></label>}
          <label className="block text-sm font-medium">Email address<input name="email" type="email" autoComplete="email" maxLength={255} required className="mt-2 h-12 w-full rounded-lg border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" /></label>
          <label className="block text-sm font-medium">Password<div className="relative mt-2"><input name="password" type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required className="h-12 w-full rounded-lg border border-input bg-card pl-3 pr-12 outline-none focus:ring-2 focus:ring-ring" placeholder={register ? 'At least 8 characters' : 'Enter your password'} /><Button type="button" variant="ghost" size="icon" title={visible ? 'Hide password' : 'Show password'} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute right-2 top-1.5" onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button></div></label>
          {error && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-destructive">{error}</p>}
          <Button disabled={busy} className="h-12 w-full" type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <>{register ? 'Create account' : 'Sign in'}<ArrowRight /></>}</Button>
          {register && <p className="text-xs leading-5 text-muted-foreground">Email verification is required. New accounts are registered as students.</p>}
        </form></>}
      </section>
    </main><footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t border-border px-6 py-6 text-xs text-muted-foreground"><span>© 2026 Balay NORSU · NORSU BSC</span><span>University Dormitory Management</span></footer>
  </div>
}