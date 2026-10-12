import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/admin/')({
 
 head: () => pageHead('Dashboard', 'A new chapter for the NORSU BSC dormitory.'),
 component: () => <EmptyPage kind="dashboard" title="Dashboard" subtitle="A new chapter for the NORSU BSC dormitory." />,
})
