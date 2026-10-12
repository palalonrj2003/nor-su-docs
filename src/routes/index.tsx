import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from '@/components/auth-page';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute("/")({
  head: () => pageHead('Welcome home', 'Balay NORSU, the student dormitory portal for Negros Oriental State University BSC.'),
  component: AuthPage,
});
