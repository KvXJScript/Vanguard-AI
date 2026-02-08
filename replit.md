# Vanguard AI - Code Intelligence Platform

## Overview

Vanguard AI is an enterprise-grade code intelligence platform that analyzes GitHub repositories for code health using multi-agent AI. Users connect public GitHub repositories, and the system scans source files to evaluate technical debt, security vulnerabilities, and documentation quality. Results are presented through visual dashboards with score rings, charts, and detailed file-level analysis with AI-suggested code refactoring. Reports can be exported as standalone HTML for GitHub Pages deployment.

The app follows a monorepo structure with three main directories: `client/` (React SPA), `server/` (Express API), and `shared/` (shared types, schemas, and route contracts).

## User Preferences

Preferred communication style: Simple, everyday language.
Creator/Brand: Vanguard AI (must appear in all branding, footers, and UI references)

## System Architecture

### Frontend (`client/src/`)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for data visualization (radial bar charts, score displays)
- **Styling**: Tailwind CSS with CSS variables for theming. Dark mode is the default theme. Fonts are Inter (sans) and JetBrains Mono (monospace).
- **Auth**: Standalone email/password authentication with `useAuth` hook. AuthPage.tsx provides tabbed login/register forms. Unauthenticated users see AuthPage instead of protected routes.
- **Key Pages**: AuthPage (login/register), Dashboard (repo list + aggregate stats), RepoDetails (scan history + charts + Security/Tech Debt/Files tabs), ScanDetails (file-level analysis with code diff viewer)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Auto-Polling**: Scan list and scan detail queries auto-poll every 3 seconds when scans are in "processing" or "pending" status

### Backend (`server/`)
- **Framework**: Express.js running on Node with TypeScript (executed via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Route contracts are defined in `shared/routes.ts` using Zod schemas.
- **Authentication**: Standalone email/password auth with bcrypt password hashing. Sessions stored in PostgreSQL using `connect-pg-simple`. Auth module at `server/auth.ts` provides register/login/logout endpoints and `isAuthenticated` middleware.
- **AI Integration**: Anthropic Claude API (claude-sonnet-4-5) for code analysis. The AI module (`server/lib/ai.ts`) sends code files to Claude and receives structured JSON with scores, issues, and refactored code suggestions.
- **GitHub Integration**: `server/lib/github.ts` fetches repository file trees and content from the GitHub API (public repos only). Filters for relevant code file extensions and ignores build artifacts.
- **GitHub Pages Export**: `server/lib/github-pages.ts` generates standalone HTML reports from scan data that can be deployed to GitHub Pages.
- **Batch Processing**: `server/replit_integrations/batch/` provides concurrency-limited, retry-capable batch processing for AI API calls.
- **Stats API**: `/api/stats` endpoint aggregates repository and scan statistics for the dashboard.

### Database
- **Engine**: PostgreSQL (referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema** (`shared/schema.ts`): 
  - `users` - Auth user records with email, password_hash, and profile fields
  - `sessions` - Express session storage (mandatory for auth)
  - `repositories` - Tracked GitHub repos linked to users
  - `scans` - Analysis runs with aggregate scores and status tracking (pending -> processing -> completed/failed)
  - `file_analyses` - Per-file analysis results with scores, issues (JSON), and refactored code suggestions

### Build & Deploy
- **Dev**: `npm run dev` runs the Express server with Vite middleware for HMR
- **Build**: `npm run build` runs a custom script that builds the client with Vite and bundles the server with esbuild
- **Production**: `npm start` serves the built app from `dist/`

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Express session secret (defaults to dev secret)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic API key
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic API base URL

### GitHub Pages Deployment
- **Static Build**: `npx vite build --config vite.config.gh-pages.ts` outputs to `docs/` directory
- **Config**: `vite.config.gh-pages.ts` builds a standalone static version of the landing page (no backend dependency)
- **Entry Point**: `client/gh-pages.html` → `client/src/gh-pages-main.tsx` → `GHPagesLandingPage.tsx`
- **GitHub Actions**: `.github/workflows/gh-pages.yml` auto-deploys to GitHub Pages on push to main
- **Environment**: Set `VITE_APP_URL` GitHub variable to point CTAs to the live app URL
- **Output**: `docs/` contains `index.html`, `404.html`, `.nojekyll`, and bundled assets

## Recent Changes
- Added GitHub Pages deployment support with separate Vite config, GitHub Actions workflow, and static landing page build
- Added scroll-triggered animations (Intersection Observer) and entrance animations (fade-in-up, fade-in-down, float, glow) to landing page
- Created useScrollAnimation hook for scroll-triggered element reveals
- Added accessibility: prefers-reduced-motion media query disables all animations
- Created comprehensive LandingPage with hero, features, how-it-works, FAQ, benefits, CTA, and footer
- Updated routing: public landing page at /, protected dashboard at /dashboard, login at /login
- AuthPage redirects to /dashboard after login/register
- Rebranded from KvX to Vanguard AI throughout the entire application
- Replaced Replit OIDC authentication with standalone email/password auth using bcrypt
- Created AuthPage.tsx with tabbed login/register forms
- Added auto-polling (3-second intervals) for scan processing/pending status
- Added /api/stats endpoint with aggregate dashboard statistics
- Enhanced Dashboard with stat cards (repos, health score, security, issues)
- Enhanced RepoDetails with Security, Tech Debt, Files, and Scan History tabs
- Increased scan file limit from 5 to 10 files per repository
- Added comprehensive data-testid attributes to all interactive and dynamic elements
- Fixed placeholder data (removed Math.random() issue count)
