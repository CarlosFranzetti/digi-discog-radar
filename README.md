# Digi Discog Radar

Discogs exploration app built with Vite, React, TypeScript, Tailwind, and shadcn-ui.

## Stack

- Frontend: Vite + React + TypeScript
- UI: Tailwind + shadcn-ui
- Serverless API: Vercel Functions (`/api/discogs/*`)
- Optional Supabase: existing project integration remains available for non-function concerns

## Local Development

Install dependencies:

```sh
npm install
```

Run frontend only:

```sh
npm run dev
```

Run Vercel full-stack local environment (frontend + API routes):

```sh
npm run dev:vercel
```

## Environment Variables

Create `.env.local` from `.env.example` and set values.

Required for Vercel Functions:

- `DISCOGS_KEY`
- `DISCOGS_SECRET`

Optional for frontend:

- `VITE_API_BASE_URL` (leave empty for same-origin `/api`; set only when frontend and API are on different origins)

Existing Supabase keys (if used elsewhere in the app):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## API Endpoints

The frontend `discogsService` now calls these internal endpoints:

- `GET /api/discogs/search`
- `GET /api/discogs/releases/:id`
- `GET /api/discogs/users/:username/collection`
- `GET /api/discogs/artists/search`

These routes proxy to Discogs and inject credentials server-side.

## Build and Quality Checks

```sh
npm run lint
npm run build
```

## Deploy to Vercel

1. Import this repository into Vercel.
2. Configure environment variables:
   - `DISCOGS_KEY`
   - `DISCOGS_SECRET`
   - (optional) `VITE_API_BASE_URL`
   - (optional, if needed) `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy.

For same-origin frontend + API on Vercel, keep `VITE_API_BASE_URL` unset.
