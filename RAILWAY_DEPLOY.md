# Deploying Vanguard AI to Railway

Complete guide to deploy the full Vanguard AI code intelligence platform (frontend, backend, PostgreSQL database, and Google Gemini AI integration) to Railway.

---

## What Gets Deployed

| Component | Description |
|---|---|
| **Frontend** | React SPA served as static files from the Express server |
| **Backend** | Express.js API handling auth, GitHub scanning, AI analysis |
| **Database** | PostgreSQL storing users, sessions, repos, scans, file analyses |
| **AI Integration** | Google Gemini API for code analysis (free API key from aistudio.google.com) |

The application is packaged as a single Docker container. The Express server serves both the API and the frontend on one port.

---

## Prerequisites

Before you begin, make sure you have:

1. **A Railway account** - Sign up at [railway.app](https://railway.app) (free trial available, then $5/month Hobby plan for persistent hosting)
2. **A GitHub account** - Your code needs to be in a GitHub repository
3. **A Google Gemini API key** - Get one for free from [aistudio.google.com](https://aistudio.google.com/) (needed for AI code analysis)
4. **Git installed** on your local machine (to push code)

---

## Step 1: Push Your Code to GitHub

If this code is not already in a GitHub repository, create one and push it:

```bash
# Initialize git (skip if already a git repo)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Vanguard AI"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/vanguard-ai.git
git branch -M main
git push -u origin main
```

**Important**: Make sure the following files are committed (they are required for deployment):
- `Dockerfile`
- `railway.toml`
- `package.json` and `package-lock.json`
- All source code in `client/`, `server/`, `shared/`, and `script/`

---

## Step 2: Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** in the top right
3. Select **"Deploy from GitHub Repo"**
4. If prompted, authorize Railway to access your GitHub account
5. Find and select the repository you pushed in Step 1
6. Railway will detect the `Dockerfile` and begin the first build

> **Note**: The first deploy will likely fail because the database isn't set up yet. That's normal - we'll fix it in the next steps.

---

## Step 3: Add a PostgreSQL Database

Your app needs a PostgreSQL database to store user accounts, scan results, and session data.

1. In your Railway project dashboard, click the **"+ New"** button (or **"+"** icon in the top right)
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway creates a PostgreSQL instance immediately

Railway automatically creates a `DATABASE_URL` variable for the database service. You need to make this available to your web service:

1. Click on your **web service** (the one connected to GitHub, not the database)
2. Go to the **"Variables"** tab
3. Click **"Add Variable"** > **"Add Reference"**
4. Select the PostgreSQL service and choose `DATABASE_URL`

This links the database connection string to your app.

---

## Step 4: Set Required Environment Variables

Click on your **web service** (the one connected to GitHub), then go to the **"Variables"** tab. Click **"New Variable"** for each of the following:

### Required Variables

| Variable | Value | How to Get It |
|---|---|---|
| `GEMINI_API_KEY` | `AIza...` | Go to [aistudio.google.com](https://aistudio.google.com/) > Get API Key > Create Key (free) |
| `SESSION_SECRET` | A random 64-character string | Run `openssl rand -hex 32` in your terminal, or use any password generator |
| `NODE_ENV` | `production` | Type exactly: `production` |

### Automatically Set (Do NOT add manually)

| Variable | Set By |
|---|---|
| `DATABASE_URL` | Linked from PostgreSQL service (Step 3) |
| `PORT` | Railway sets this automatically |

> **Security Note**: The `SESSION_SECRET` is used to encrypt user session cookies. Use a long, random string and never share it. If compromised, change it immediately (existing users will need to log in again).

---

## Step 5: Initialize the Database Tables

The database needs its tables created before the app can work. You have two options:

### Option A: Using Railway's Shell (Recommended)

1. Wait for a successful deploy to complete (the app may crash at startup, but the container is available)
2. Click on your **web service** in Railway
3. Click the **"Shell"** tab (or the terminal icon)
4. In the shell, run:

```bash
npx drizzle-kit push
```

5. When prompted, type `yes` to confirm creating the tables
6. You should see output confirming these tables were created:
   - `sessions` (for login sessions)
   - `users` (for user accounts)
   - `repositories` (for tracked GitHub repos)
   - `scans` (for analysis runs)
   - `file_analyses` (for per-file analysis results)

### Option B: Using Railway CLI (From Your Local Machine)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to your Railway account
railway login

# Link to your project (follow the prompts to select your project and service)
railway link

# Run the database migration
railway run npx drizzle-kit push
```

After the tables are created, **redeploy** your service:
1. Go to your web service in Railway
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment (or push a new commit)

---

## Step 6: Generate a Public URL

1. Click on your **web service** in Railway
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"**
5. Railway assigns a URL like `your-app-name.up.railway.app`
6. Visit the URL in your browser - your app should be live!

---

## Step 7: Create Your Account and Start Using the App

1. Visit your Railway URL
2. You'll see the Vanguard AI landing page
3. Click **"Get Started"** or go to `/login`
4. Register a new account with your email and password
5. Once logged in, add a public GitHub repository URL to analyze
6. Click "Scan" to run AI-powered code analysis

---

## Optional: Custom Domain

If you want to use your own domain (e.g., `app.yourdomain.com`):

1. In your web service, go to **"Settings"** > **"Networking"**
2. Click **"+ Custom Domain"**
3. Enter your domain name
4. Railway provides a CNAME record value
5. In your DNS provider (Cloudflare, Namecheap, etc.), add a CNAME record:
   - **Type**: CNAME
   - **Name**: `app` (or whatever subdomain you chose)
   - **Value**: The value Railway provided
6. Wait for DNS propagation (usually 5-30 minutes)
7. Railway automatically provisions an SSL certificate

---

## How It Works in Production

### Architecture Overview

```
User's Browser
    ↓ HTTPS
Railway Domain (your-app.up.railway.app)
    ↓
Express Server (single container)
    ├── Serves React SPA (static files from dist/public/)
    ├── API Routes (/api/*)
    │   ├── Auth: /api/auth/register, /api/auth/login, /api/auth/logout
    │   ├── Repos: /api/repos (CRUD)
    │   ├── Scans: /api/repos/:id/scans (create, list, get)
    │   ├── Export: /api/scans/:id/export (HTML report)
    │   ├── Stats: /api/stats (dashboard metrics)
    │   └── Health: /api/health (uptime monitoring)
    ├── Google Gemini API (AI code analysis)
    └── PostgreSQL Database (Railway-managed)
```

### Key Production Behaviors

- **Secure cookies**: Sessions use `secure: true` and `httpOnly: true` over HTTPS
- **Trust proxy**: Express trusts Railway's reverse proxy for correct IP/protocol detection
- **Health checks**: Railway pings `/api/health` every 30 seconds to verify the app is running
- **Auto-restart**: If the app crashes, Railway restarts it automatically (up to 3 retries)
- **Zero-downtime deploys**: New deploys start a fresh container before stopping the old one

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes (auto) | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (free) | `AIza...` |
| `SESSION_SECRET` | Yes | Secret for encrypting session cookies | `a1b2c3d4e5f6...` (64+ chars) |
| `NODE_ENV` | Yes | Must be `production` | `production` |
| `PORT` | Auto | Server port (Railway sets this) | `3000` |

---

## Updating Your App

Every time you push to `main`, Railway automatically rebuilds and redeploys:

```bash
# Make your changes locally
git add .
git commit -m "Add new feature"
git push origin main
```

Railway will:
1. Detect the push
2. Build a new Docker image (~2-3 minutes)
3. Start the new container
4. Switch traffic to the new container (zero downtime)
5. Stop the old container

You can also trigger a manual redeploy from the **"Deployments"** tab.

---

## Troubleshooting

### App won't start / "Application failed to respond"

**Check the deploy logs:**
1. Click your web service > **"Deployments"** tab
2. Click the failed deployment
3. Check the **"Build Logs"** and **"Deploy Logs"** tabs

**Common causes:**
- `DATABASE_URL` not linked - Make sure the PostgreSQL variable reference is set (Step 3)
- Database tables not created - Run `npx drizzle-kit push` (Step 5)
- Missing environment variables - Verify all required vars are set (Step 4)

### "Database connection failed" or "DATABASE_URL must be set"

- Make sure you added a PostgreSQL database (Step 3)
- Make sure the `DATABASE_URL` variable reference is added to your **web service** (not just the database service)
- Click on your web service > Variables tab > confirm `DATABASE_URL` is listed

### "AI analysis failed" or scans show all zeros

- Verify `GEMINI_API_KEY` is set correctly (no extra spaces, correct key)
- Get a free API key at [aistudio.google.com](https://aistudio.google.com/) if you don't have one
- Check deploy logs for specific error messages from the Gemini API

### "Login not working" or "Session not persisting"

- Ensure `NODE_ENV=production` is set
- Make sure you're accessing the app via HTTPS (Railway domains use HTTPS by default)
- The app uses secure cookies which require HTTPS to work
- If you recently changed `SESSION_SECRET`, all existing sessions are invalidated - users need to log in again

### "Build failed" during deployment

- Check the build logs in Railway for specific errors
- Make sure `package-lock.json` is committed (run `npm install` locally first)
- Verify the `Dockerfile` is committed and matches the one in this repo
- The build requires ~1GB of memory - Railway's Hobby plan provides enough

### "Cannot find module" errors at runtime

- Make sure `package.json` is committed with all dependencies listed
- Check that the dependency is in `dependencies` (not just `devDependencies`) if it's needed at runtime
- Redeploy after fixing

### Health check failing

- The app responds to `GET /api/health` with `{"status":"ok"}`
- If health checks fail, the app isn't starting - check deploy logs
- Railway allows 30 seconds for the health check; if the app takes longer to start, it will be marked as unhealthy

---

## Cost Estimate

Railway pricing (as of 2025):

| Item | Cost |
|---|---|
| **Hobby Plan** | $5/month (required for persistent hosting) |
| **Compute** | ~$0.000463/min (~$20/month for always-on) |
| **PostgreSQL** | ~$0.000231/min (~$10/month) |
| **Estimated Total** | ~$10-35/month depending on usage |

The free trial gives you $5 of credits to test with. For production use, the Hobby plan ($5/month) is required to keep your app running 24/7.

Google Gemini API has a generous free tier. For most usage, there is no additional cost for AI analysis.

---

## Files Included for Deployment

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Docker build (builder + runner) |
| `railway.toml` | Railway-specific deployment configuration |
| `.dockerignore` | Files excluded from Docker build context |
| `drizzle.config.ts` | Database migration configuration (copied into container) |
| `shared/` | Database schema definitions (copied into container for migrations) |

These files are all committed and ready to use. No additional configuration is needed beyond setting the environment variables described above.
