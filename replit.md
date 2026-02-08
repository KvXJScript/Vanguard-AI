# KvX - Code Intelligence Platform

## Overview

KvX is an enterprise-grade code intelligence platform that analyzes GitHub repositories for code health using multi-agent AI. Users connect public GitHub repositories, and the system scans source files to evaluate technical debt, security vulnerabilities, and documentation quality. Results are presented through visual dashboards with score rings, charts, and detailed file-level analysis with AI-suggested code refactoring. Reports can be exported as standalone HTML for GitHub Pages deployment.

The app follows a monorepo structure with three main directories: `client/` (React SPA), `server/` (Express API), and `shared/` (shared types, schemas, and route contracts).

## User Preferences

Preferred communication style: Simple, everyday language.
Creator/Brand: KvX (must appear in all branding, footers, and UI references)

## System Architecture

### Frontend (`client/src/`)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for data visualization (radial bar charts, score displays)
- **Styling**: Tailwind CSS with CSS variables for theming. Dark mode is the default theme. Fonts are Inter (sans) and JetBrains Mono (monospace).
- **Auth**: Custom `useAuth` hook that checks `/api/auth/user` endpoint. Unauthenticated users are redirected to `/api/login`.
- **Key Pages**: Landing (public), Dashboard (repo list), RepoDetails (scan history + charts), ScanDetails (file-level analysis with code diff viewer)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Framework**: Express.js running on Node with TypeScript (executed via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Route contracts are defined in `shared/routes.ts` using Zod schemas.
- **Authentication**: OpenID Connect (OIDC). Sessions stored in PostgreSQL using `connect-pg-simple`. Auth middleware is in `server/replit_integrations/auth/`.
- **AI Integration**: Anthropic Claude API (claude-sonnet-4-5) for code analysis. The AI module (`server/lib/ai.ts`) sends code files to Claude and receives structured JSON with scores, issues, and refactored code suggestions.
- **GitHub Integration**: `server/lib/github.ts` fetches repository file trees and content from the GitHub API (public repos only). Filters for relevant code file extensions and ignores build artifacts.
- **GitHub Pages Export**: `server/lib/github-pages.ts` generates standalone HTML reports from scan data that can be deployed to GitHub Pages.
- **Batch Processing**: `server/replit_integrations/batch/` provides concurrency-limited, retry-capable batch processing for AI API calls.

### Database
- **Engine**: PostgreSQL (referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema** (`shared/schema.ts`): 
  - `users` - Auth user records (mandatory, string ID)
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
- `SESSION_SECRET` - Express session secret (required for auth)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic API key
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic API base URL

## Recent Changes
- Rebranded from CodeRadar to KvX throughout the application
- Added GitHub Pages standalone export feature with `/api/scans/:id/export` endpoint
- Export buttons added to ScanDetails header and RepoDetails scan history rows
- Enhanced landing page with 6 feature cards
- Added SEO meta tags
- Fixed emoji usage (replaced with Lucide icons)
- Added comprehensive data-testid attributes to all interactive and dynamic elements
- Replaced custom hover styles with hover-elevate utility classes per design guidelines
- Dashboard cards, sidebar nav items, and scan history rows use proper interaction patterns
