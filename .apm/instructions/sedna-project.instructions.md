---
description: Sedna FM project-specific context, architecture decisions, and development history
applyTo: '**'
---

# Sedna FM - Project Memory & Context

## Project Overview

**Sedna FM** is an interactive radio player website featuring curated episode channels, a retro radio interface, and AI-powered mood-based recommendations.

- **Website**: Static site hosted on GitHub Pages
- **Backend**: Azure Functions (Python) for AI recommendations
- **AI Model**: Azure OpenAI GPT-5 nano

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
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Deployment name (default: `gpt-5-nano`)

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
| `scripts/modules/player.js` | SoundCloud player integration |
| `scripts/modules/channels.js` | Channel filtering logic |
| `api/function_app.py` | Azure Function with AI recommendation |
| `data/episodes.json` | Episode catalog |
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
