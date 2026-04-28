# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

This monorepo currently hosts **CleanCity Connect**, a community garbage-reporting full-stack web app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 18 + Vite + Tailwind v4 + shadcn/ui + wouter
- **Auth**: Clerk (whitelabel via Replit integration)
- **Maps**: Leaflet + react-leaflet (OpenStreetMap tiles)
- **Object storage**: Replit App Storage (presigned PUT uploads)

## Artifacts

- `artifacts/api-server` — Express API mounted at `/api` (auth, reports, admin, rewards, stats, storage)
- `artifacts/cleancity` — React+Vite web app (landing, dashboard, new report, public map, rewards, admin)
- `artifacts/mockup-sandbox` — design preview server (template scaffold)

## CleanCity Connect — features

- Public landing page + sign-in/sign-up powered by Clerk (eco-green branded UI).
- Public Leaflet map with all reports color-coded by status.
- Authenticated dashboard with eco-points, status breakdown, and recent reports.
- New-report page: photo upload (presigned PUT to object storage), map pin (click or geolocation), location label & description.
- Rewards catalog with point-cost gating and redemption codes; per-user redemption history.
- Admin panel: pending-queue verification, point award, role management, top-reporter leaderboard.
- The very first user to sign in is auto-promoted to `admin` so the app is usable out-of-the-box.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/cleancity run typecheck` — typecheck the web app
- Workflows (auto-managed): `artifacts/api-server: API Server`, `artifacts/cleancity: web`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
