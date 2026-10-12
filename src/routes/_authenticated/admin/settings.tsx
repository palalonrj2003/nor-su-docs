import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/admin/settings')({
 beforeLoad: ({ context }) => { if (!context.identity.roles.includes('admin')) throw redirect({ to: '/admin' }) },
 head: () => pageHead('Settings', 'Dormitory application period settings.'),
 component: () => <EmptyPage kind="settings" title="Settings" subtitle="Dormitory application period settings." />,
})
