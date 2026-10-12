import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/admin/residents')({
 
 head: () => pageHead('Residents', 'The current dormitory resident masterlist.'),
 component: () => <EmptyPage kind="residents" title="Residents" subtitle="The current dormitory resident masterlist." />,
})
