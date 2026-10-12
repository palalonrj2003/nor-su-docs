import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/admin/applications')({
 beforeLoad: ({ context }) => { if (!context.identity.roles.includes('admin')) throw redirect({ to: '/admin' }) },
 head: () => pageHead('Applications', 'Student dormitory applications.'),
 component: () => <EmptyPage kind="applications" title="Applications" subtitle="Student dormitory applications." />,
})
