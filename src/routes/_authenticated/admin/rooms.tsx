import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyPage } from '@/components/empty-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/_authenticated/admin/rooms')({
 
 head: () => pageHead('Rooms & Beds', 'Building, room and bed availability.'),
 component: () => <EmptyPage kind="rooms" title="Rooms & Beds" subtitle="Building, room and bed availability." />,
})
