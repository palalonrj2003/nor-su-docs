import { createFileRoute } from '@tanstack/react-router'
import { LegalPage, PrivacyContent } from '@/components/legal-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/privacy')({
  head: () => pageHead('Privacy Notice', 'How Balay NORSU collects, uses and protects your personal data under the Data Privacy Act of 2012.'),
  component: () => <LegalPage title="Privacy Notice"><PrivacyContent /></LegalPage>,
})
