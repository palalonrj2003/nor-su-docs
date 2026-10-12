import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/components/auth-page'
import { pageHead } from '@/lib/metadata'
export const Route = createFileRoute('/auth')({ head: () => pageHead('Sign in', 'Sign in or create your verified Balay NORSU student account.'), component: AuthPage })