# claude-permissions-manager

A client-side web app for merging Claude Code `settings.json` permission files: upload or paste multiple settings files, resolve conflicts, review a diff, and export the merged result. Includes an MDX blog and a feedback form backed by a Vercel function (Resend).

## Stack

React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion, React Router. MDX for blog content. Deployed on Vercel; `api/feedback.ts` is the only serverless function.

## Commands

- `npm run dev` — start the dev server
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest unit/component tests
- `npm run test:e2e` — Playwright smoke tests (against `vite preview`)
- `npm run build` — production build

## Conventions

- All merge state is client-side (SessionStorage; LocalStorage only for persistent settings). No database.
- `@/` resolves to `src/` (see `vite.config.ts` and `tsconfig.json`).
- Blog posts live in `src/content/blog/*.mdx` and are registered in `src/content/blog/index.ts`; the sitemap picks up MDX files automatically via `vite.config.ts`.
