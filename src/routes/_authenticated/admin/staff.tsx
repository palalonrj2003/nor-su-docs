import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/admin/staff')({
 beforeLoad: ({ context }) => { if (!context.identity.roles.includes('admin')) throw redirect({ to: '/admin' }) },
 head: () => pageHead('Staff', 'Dormitory staff accounts.'),
 component: () => <EmptyPage kind="staff" title="Staff" subtitle="Dormitory staff accounts." />,
})
