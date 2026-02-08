# Deploying Vanguard AI to Railway

This guide walks you through deploying the full Vanguard AI application (frontend, backend, database, and AI scanning) to Railway from scratch.

---

## Prerequisites

- A [Railway account](https://railway.app) (free tier available)
- A [GitHub account](https://github.com) with this code pushed to a repository
- An [Anthropic API key](https://console.anthropic.com/) for AI-powered code analysis

---

## Step 1: Push Your Code to GitHub

If you haven't already, push this project to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Create a New Project on Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub Repo"**
4. Connect your GitHub account if you haven't already
5. Select the repository you just pushed

Railway will detect the `Dockerfile` and `railway.toml` automatically.

---

## Step 3: Add a PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"** (or the **"+"** button)
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL instance and automatically set the `DATABASE_URL` environment variable in your project

No additional configuration is needed — the app reads `DATABASE_URL` automatically.

---

## Step 4: Set Environment Variables

In your Railway project, click on your **web service** (not the database), then go to the **"Variables"** tab. Add these variables:

| Variable | Value | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/) | Yes |
| `SESSION_SECRET` | A random string (e.g., `openssl rand -hex 32` in your terminal) | Yes |
| `NODE_ENV` | `production` | Yes |

**Important**: The `DATABASE_URL` variable is set automatically when you link the PostgreSQL database. You do not need to add it manually.

---

## Step 5: Link the Database to Your Service

1. Click on your **PostgreSQL database** in the project dashboard
2. Go to the **"Connect"** tab
3. Under **"Available Variables"**, find `DATABASE_URL`
4. Click **"Add Reference"** and select your web service

This ensures your app can connect to the database.

---

## Step 6: Initialize the Database

The database tables need to be created on first deploy. Railway provides a one-time command runner:

1. Click on your **web service**
2. Go to the **"Settings"** tab
3. Under **"Deploy"**, find **"Custom Start Command"** — leave it as default (`node dist/index.cjs`)
4. Open the **"Shell"** tab or use Railway CLI to run:

```bash
npx drizzle-kit push
```

This creates all the tables (users, sessions, repositories, scans, file_analyses).

**Alternative**: Use the Railway CLI locally:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run the migration
railway run npx drizzle-kit push
```

---

## Step 7: Deploy

After setting up environment variables and the database:

1. Railway auto-deploys on every push to `main`
2. You can also trigger a manual deploy from the Railway dashboard
3. Wait for the build to complete (usually 2-3 minutes)

---

## Step 8: Access Your App

1. In your Railway project, click on your **web service**
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a public URL (e.g., `your-app.up.railway.app`)
4. Visit the URL — your app is live!

---

## Step 9: (Optional) Custom Domain

1. In **"Settings"** → **"Networking"** → **"Custom Domain"**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Configure your DNS with the CNAME record Railway provides
4. Railway handles SSL certificates automatically

---

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Set by Railway |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI analysis | Required |
| `SESSION_SECRET` | Secret for session encryption | Required in production |
| `NODE_ENV` | Set to `production` | Required |
| `PORT` | Server port | `3000` (set in Dockerfile) |

---

## Troubleshooting

### "Database connection failed"
- Make sure the PostgreSQL database is linked to your service (Step 5)
- Check that `DATABASE_URL` appears in your service's Variables tab

### "AI analysis failed"
- Verify `ANTHROPIC_API_KEY` is set correctly
- Make sure your Anthropic account has available credits

### "Login not working / cookies not persisting"
- Ensure `NODE_ENV=production` is set
- The app uses `trust proxy` and secure cookies in production, which requires HTTPS — Railway provides this by default

### "Build failed"
- Check the build logs in Railway for specific errors
- Make sure all files are committed and pushed to GitHub

---

## Updating the App

Simply push new commits to your `main` branch on GitHub. Railway automatically rebuilds and redeploys.

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway performs zero-downtime deployments by default.
