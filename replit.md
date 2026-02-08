# CodeRadar - AI Codebase Health Analyzer

## Overview

CodeRadar is a full-stack web application that analyzes GitHub repositories for code health using AI. Users connect public GitHub repositories, and the system scans source files to evaluate technical debt, security vulnerabilities, and documentation quality. Results are presented through visual dashboards with score rings, charts, and detailed file-level analysis with AI-suggested code refactoring.

The app follows a monorepo structure with three main directories: `client/` (React SPA), `server/` (Express API), and `shared/` (shared types, schemas, and route contracts).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (`client/src/`)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for data visualization (radial bar charts, score displays)
- **Styling**: Tailwind CSS with CSS variables for theming. Dark mode is the default theme ("Midnight Radar" palette). Fonts are Inter (sans) and JetBrains Mono (monospace).
- **Auth**: Custom `useAuth` hook that checks `/api/auth/user` endpoint. Unauthenticated users are redirected to `/api/login` (Replit Auth flow).
- **Key Pages**: Landing (public), Dashboard (repo list), RepoDetails (scan history + charts), ScanDetails (file-level analysis with code diff viewer)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Framework**: Express.js running on Node with TypeScript (executed via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Route contracts are defined in `shared/routes.ts` using Zod schemas, providing a typed API contract shared between client and server.
- **Authentication**: Replit Auth via OpenID Connect (OIDC). Sessions stored in PostgreSQL using `connect-pg-simple`. Auth middleware is in `server/replit_integrations/auth/`.
- **AI Integration**: Anthropic Claude API (claude-sonnet-4-5) for code analysis. The AI module (`server/lib/ai.ts`) sends code files to Claude and receives structured JSON with scores, issues, and refactored code suggestions. Uses environment variables `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`.
- **GitHub Integration**: `server/lib/github.ts` fetches repository file trees and content from the GitHub API (public repos only, no auth token required). Filters for relevant code file extensions and ignores build artifacts.
- **Batch Processing**: `server/replit_integrations/batch/` provides concurrency-limited, retry-capable batch processing for AI API calls using `p-limit` and `p-retry`.
- **Chat Integration**: `server/replit_integrations/chat/` provides a separate conversational AI feature with its own storage and routes.

### Database
- **Engine**: PostgreSQL (required, referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema** (`shared/schema.ts`): 
  - `users` - Replit Auth user records (mandatory, string ID)
  - `sessions` - Express session storage (mandatory for Replit Auth)
  - `repositories` - Tracked GitHub repos linked to users
  - `scans` - Analysis runs with aggregate scores and status tracking (pending → processing → completed/failed)
  - `file_analyses` - Per-file analysis results with scores, issues (JSON), and refactored code suggestions
  - `conversations` / `messages` - Chat feature tables
- **Migrations**: Use `npm run db:push` (drizzle-kit push) to sync schema to database. Migration files output to `./migrations/`.

### Build & Deploy
- **Dev**: `npm run dev` runs the Express server with Vite middleware for HMR
- **Build**: `npm run build` runs a custom script (`script/build.ts`) that builds the client with Vite and bundles the server with esbuild. Server dependencies on an allowlist are bundled; others are externalized.
- **Production**: `npm start` serves the built app from `dist/`

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Express session secret (required for auth)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic API key
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic API base URL
- `ISSUER_URL` - OIDC issuer (defaults to Replit)
- `REPL_ID` - Replit environment identifier

## External Dependencies

- **PostgreSQL** - Primary database for all application data and session storage
- **Anthropic Claude API** - AI-powered code analysis (technical debt, security, documentation scoring). Uses claude-sonnet-4-5 model.
- **GitHub API** - Fetches public repository file trees and content (unauthenticated, subject to rate limits)
- **Replit Auth (OIDC)** - User authentication via OpenID Connect with Replit as the identity provider
- **shadcn/ui + Radix UI** - Component library foundation (configured in `components.json`)
- **Recharts** - Chart visualization library for score displays
- **Drizzle ORM + drizzle-kit** - Database ORM and migration tooling