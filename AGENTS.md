# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React + TypeScript app with Tailwind and shadcn-ui. Core layout:
- `src/App.tsx` and `src/main.tsx` wire the root app and client entry.
- `src/pages/` holds routed views; keep page-level logic here.
- `src/components/` and `src/components/ui/` contain shared UI and shadcn primitives.
- `src/hooks/`, `src/lib/`, and `src/services/` host reusable logic, helpers, and API wrappers.
- `src/integrations/supabase/` contains the generated Supabase client and types; avoid editing generated files.
- `public/` stores static assets; Tailwind styles live in `src/index.css`.

## Build, Test, and Development Commands
Use npm scripts from `package.json`:
```bash
npm run dev        # Start the Vite dev server
npm run build      # Production build to dist/
npm run build:dev  # Development-mode build
npm run preview    # Serve the production build locally
npm run lint       # ESLint checks for .ts/.tsx
```

## Coding Style & Naming Conventions
- TypeScript + React function components; prefer named exports for shared components.
- Indentation: 2 spaces; semicolons and double quotes are standard across the repo.
- Tailwind is the default styling approach; global tokens live in `src/index.css` and use HSL.
- ESLint is configured in `eslint.config.js`; fix lint issues before opening a PR.

## Testing Guidelines
No automated test runner is configured yet. If you add tests, place them alongside sources (e.g., `src/pages/Foo.test.tsx`) and update this guide with the chosen framework and commands.

## Commit & Pull Request Guidelines
- Commit messages in history use short, imperative, capitalized phrases (e.g., `Fix label radar release display`). Follow that pattern.
- PRs should include a clear description, steps to verify, and screenshots or short clips for UI changes.

## Security & Configuration Tips
- Supabase relies on `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Keep secrets out of the repo; use `.env.local`.
- `src/integrations/supabase/client.ts` is generated; regenerate rather than editing directly.
