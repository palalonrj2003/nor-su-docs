import { createFileRoute, redirect } from '@tanstack/react-router'
import { DormShell } from '@/components/dorm-shell'
export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context }) => { if (!context.identity.roles.some(r => r === 'admin' || r === 'staff')) throw redirect({ to: '/my-application' }) },
  component: DormShell,
})