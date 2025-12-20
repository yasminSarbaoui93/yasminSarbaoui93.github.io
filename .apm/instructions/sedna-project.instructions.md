---
description: Sedna FM project-specific context, architecture decisions, and development history
applyTo: '**'
---

# Sedna FM - Project Memory & Context

## Project Overview

**Sedna FM** is an interactive radio player website featuring curated episode channels, a retro radio interface, AI-powered mood-based recommendations, and **Daily Fact & Match** with hourly Wikipedia facts.

- **Website**: Static site hosted on GitHub Pages (https://sedna.fm)
- **Backend**: Azure Functions (Python) for AI recommendations + daily facts
- **AI Models**: 
  - GPT-5 nano (mood recommendations)
  - GPT-5.1 (daily facts generation)

---

## Architecture

### Frontend (Static Site)
- **Hosting**: GitHub Pages
- **Entry Point**: `index.html`
- **Scripts**: Modular JavaScript in `scripts/modules/`
- **Styles**: `styles/main.css`

### Backend (Azure Functions)
- **Location**: `api/` folder
- **Runtime**: Python 3.11
- **Endpoints**:
  - `POST /api/recommend` - Mood-based episode recommendation
  - `GET /api/health` - Health check
  - `GET /api/generate-daily-fact` - Manual daily fact generation
  - `GET /api/generate-daily-fact?batch=true&commit=true` - Generate 24 hourly facts
  - `GET /api/generate-daily-fact?publish=true&commit=true` - Publish next fact from queue
- **Timer Triggers**:
  - `daily_batch_generator` - 00:00 UTC daily, generates 24 facts using GPT-5.1
  - `hourly_fact_publisher` - Every hour at :00, publishes next fact from queue

### Deployment Pipeline

| Environment | Branch | Azure Function App | Trigger |
|-------------|--------|-------------------|---------|
| **Development** | `develop` | `sedna-website-func-dev-ch` | Push to `api/**` or `data/**` |
| **Production** | `main` | `sedna-website-func-ch` | Push to `api/**` or `data/**` |

### API URLs
- **Dev**: `https://sedna-website-func-dev-ch.azurewebsites.net/api/recommend`
- **Prod**: `https://sedna-website-func-ch.azurewebsites.net/api/recommend`

---

## Key Features

### 1. Radio Channel System
Four distinct channels with filtering:
- **CH 1 - Morning Drops**: Morning episodes (~40 episodes)
- **CH 2 - Sedna FM**: Core episodes (~5 episodes)
- **CH 3 - Evening Flows**: Evening episodes
- **CH 4 - On The Go**: Mobile-friendly episodes

### 2. Choose Your Mood (AI-Powered)
Location: `scripts/modules/mood.js`

**Available Moods**: Happy, Calm, Reflective, Sad, Energetic, Intimate, Moody, Carefree

**Flow**:
1. User selects a mood button
2. Frontend sends mood + exclusion list to Azure Function
3. AI analyzes episodes and recommends best match
4. SoundCloud player auto-plays the recommended track
5. "Next" button gets another recommendation (excluding already-played)

### 3. Session Memory (Added December 2024)
**Problem**: Clicking "Next" on same mood would repeat tracks.

**Solution**: Frontend session memory using `sessionStorage`:
- Tracks played episode IDs per mood
- Sends exclusion list to API: `{ mood: "Calm", exclude: [5, 12, 3] }`
- API filters out excluded episodes before AI recommendation
- Memory auto-clears on browser refresh (by design)
- When all episodes played → memory resets automatically

**Key Files**:
- Frontend: `scripts/modules/mood.js` (session storage helpers)
- Backend: `api/function_app.py` (exclusion filtering)

### 4. Daily Fact & Match (Added December 2025)
**Feature**: Hourly rotating historical facts matched with Sedna FM episodes.

**How It Works**:
1. **Midnight (00:00 UTC)**: Timer trigger calls GPT-5.1 to generate 24 facts for the day
   - Fetches Wikipedia "On this day" events via REST API
   - Prioritizes music, science, space, nature, earth, astronomy events
   - GPT-5.1 selects intriguing facts and matches each with an episode
   - Stores schedule in `data/daily_match.json` (commits to GitHub)
2. **Every Hour (:00)**: Timer trigger publishes next fact from queue
   - Pops next fact from queue, sets as `current_fact`
   - Commits updated JSON to GitHub (no AI call needed)
3. **Frontend**: Reads `daily_match.json` and displays current fact
   - Fetches episode artwork from SoundCloud oEmbed API
   - Shows "Read more" link to Wikipedia article

**JSON Structure** (`data/daily_match.json`):
```json
{
  "date": "2025-12-20",
  "current_hour": 14,
  "current_fact": {
    "fact_text": "On December 20, 1951...",
    "fact_year": 1951,
    "fact_wikipedia_url": "https://en.wikipedia.org/wiki/...",
    "episode": { "id": 5, "title": "...", "soundcloudUrl": "..." },
    "match_reason": "..."
  },
  "queue": [ /* facts for hours 15-23 */ ],
  "published": [ /* facts already shown: hours 0-14 */ ]
}
```

**Key Files**:
- Frontend: `scripts/modules/dailyFact.js`
- Backend: `api/function_app.py` (`fetch_wikipedia_events`, `get_daily_match`, `daily_batch_generator`, `hourly_fact_publisher`)
- Data: `data/daily_match.json` (auto-updated by Azure Function)

**Environment Variables** (for daily facts):
- `AZURE_OPENAI_API_KEY_DAILY` - GPT-5.1 API key
- `AZURE_OPENAI_ENDPOINT_DAILY` - GPT-5.1 endpoint
- `AZURE_OPENAI_MODEL_DAILY` - Model name (gpt-5.1)
- `GITHUB_TOKEN` - GitHub PAT for auto-commits
- `GITHUB_REPO` - Repository name
- `GITHUB_BRANCH` - Branch to commit to (main for prod, develop for dev)

---

## Episode Data

**Source**: `data/episodes.json`

**Episode Schema**:
```json
{
  "id": 1,
  "title": "Episode Title",
  "description": "Episode description...",
  "soundcloudUrl": "https://soundcloud.com/...",
  "channel": "morning-drops",
  "songs": ["Song 1", "Song 2"]
}
```

**Channels** (for filtering):
- `morning-drops`
- `sedna-fm`
- `evening-flows`
- `on-the-go`

---

## Development Workflow

### Local Testing
```bash
# Frontend (from root)
live-server

# Backend (from api/)
func start
```

### Environment Variables (Azure Function)

**Mood Recommendations (GPT-5 nano)**:
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL (`sedna-website-foundry-ch`)
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Deployment name (default: `gpt-5-nano`)

**Daily Facts (GPT-5.1)**:
- `AZURE_OPENAI_API_KEY_DAILY` - GPT-5.1 API key
- `AZURE_OPENAI_ENDPOINT_DAILY` - GPT-5.1 endpoint (`yasmi-mjc1puli-eastus2`)
- `AZURE_OPENAI_MODEL_DAILY` - Model name (`gpt-5.1`)

**GitHub Auto-Commit**:
- `GITHUB_TOKEN` - GitHub Personal Access Token (expires, needs rotation)
- `GITHUB_REPO` - `yasminSarbaoui93/yasminSarbaoui93.github.io`
- `GITHUB_BRANCH` - `main` (prod) or `develop` (dev)

### Deployment
1. Work on `develop` branch
2. Commit changes to `api/**` or `data/**`
3. Push to trigger GitHub Action deployment to dev
4. Test on dev environment
5. Merge to `main` for production deployment

---

## Technical Decisions & Rationale

### Why Session Storage (not Server-Side Memory)?
- **Simplicity**: No database or Redis needed
- **Privacy**: No user tracking across sessions
- **Cost**: Zero infrastructure cost
- **Behavior**: Natural reset on refresh matches user expectations

### Why Frontend Exclusion List (not Server Sessions)?
- **Stateless API**: Azure Functions scale better stateless
- **No cold-start issues**: No session state to lose
- **Transparency**: Frontend controls what's excluded

### Future Enhancement: Microsoft Agent Framework
If more sophisticated memory/conversation is needed:
- Use Azure AI Agent Service with thread-based conversations
- Agents maintain state across multiple turns
- Better for complex multi-step recommendations

---

## File Reference

| File | Purpose |
|------|---------|
| `scripts/modules/mood.js` | Mood UI, session memory, API calls |
| `scripts/modules/dailyFact.js` | Daily fact display, SoundCloud artwork fetch |
| `scripts/modules/player.js` | SoundCloud player integration |
| `scripts/modules/channels.js` | Channel filtering logic |
| `api/function_app.py` | Azure Function: mood API + daily fact timers |
| `data/episodes.json` | Episode catalog |
| `data/daily_match.json` | Hourly fact (auto-updated by Azure Function) |
| `.github/workflows/deploy-function-dev.yml` | Dev deployment |
| `.github/workflows/deploy-function-prod.yml` | Prod deployment |

---

## Troubleshooting

### "Next" plays same track repeatedly
- Check browser console for `[Mood]` logs
- Verify `memoryReset` is not `undefined` (means API not updated)
- Redeploy Azure Function if needed

### API returns 500 error
- Check Azure Function logs in Azure Portal
- Verify environment variables are set
- Check `episodes.json` is copied during deployment

### SoundCloud player not loading
- Check SoundCloud URL is valid
- Verify SC.Widget API is loaded
- Check browser console for iframe errors

### Daily Fact not updating
- Check `GITHUB_TOKEN` hasn't expired (90-day expiry)
- Verify `GITHUB_BRANCH` is set correctly (main for prod)
- Manually trigger: `curl "https://sedna-website-func-ch.azurewebsites.net/api/generate-daily-fact?batch=true&commit=true"`
- Check Azure Function logs for timer trigger errors
- Restart function app: `az functionapp restart --name sedna-website-func-ch --resource-group rg-sedna-website-prod-ch`

### Daily Fact showing old data on website
- GitHub Pages CDN cache (up to 10 min) - wait or hard refresh
- Check raw file: `curl "https://raw.githubusercontent.com/yasminSarbaoui93/yasminSarbaoui93.github.io/main/data/daily_match.json"`
