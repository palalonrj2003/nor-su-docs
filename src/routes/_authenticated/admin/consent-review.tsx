import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/admin/consent-review')({
 beforeLoad: ({ context }) => { if (!context.identity.roles.includes('admin')) throw redirect({ to: '/admin' }) },
 head: () => pageHead('Consent Review', 'Notarized parental consent verification.'),
 component: () => <EmptyPage kind="consent" title="Consent Review" subtitle="Notarized parental consent verification." />,
})
