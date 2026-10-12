import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getIdentity } from '@/lib/identity'
export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const identity = await getIdentity()
    if (!identity) throw redirect({ to: '/auth' })
    return { identity }
  },
  component: Outlet,
})