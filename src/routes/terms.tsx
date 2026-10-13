import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, TermsContent } from '@/components/legal-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/terms')({
  head: () => pageHead('Terms and Conditions', 'The terms for using the Balay NORSU dormitory application system.'),
  component: () => <LegalPage title="Terms and Conditions"><TermsContent /></LegalPage>,
})
