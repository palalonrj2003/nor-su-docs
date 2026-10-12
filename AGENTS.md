<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the uploaded MVP specification as PROJECT_SPEC.md and implement its prompts incrementally, so later functionality does not leak into the kickoff.
- Use TanStack Start file routing and a client-only authenticated layout, because Cloud Auth browser sessions are not available to SSR.
- Keep roles in protected user_roles rows and use database-backed role checks, so profile metadata cannot grant privileges.
- Use shared semantic CSS tokens and the official uploaded seal asset pointer, so all role layouts remain visually consistent.
