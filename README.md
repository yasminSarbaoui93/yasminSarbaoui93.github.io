# yasminSarbaoui93.github.io

## Sedna FM - A Radio Show from Another Planet

Sedna FM is an interactive radio player website featuring curated episode channels, a retro radio interface, **AI-powered mood-based recommendations**, and **Daily Fact & Match** with hourly Wikipedia facts.

## Features

### Daily Fact & Match 🌟 (NEW)
Every hour, discover a fascinating historical fact that happened on this day:
- **Hourly Updates**: New fact every hour, 24 different facts per day
- **AI-Curated**: GPT-5.1 selects intriguing facts from Wikipedia "On this day"
- **Episode Matching**: Each fact is paired with a Sedna FM episode that matches its vibe
- **Topics**: Music, science, space, nature, earth, astronomy events prioritized
- **Read More**: Link to Wikipedia for deeper exploration
- **Dynamic Artwork**: Shows actual SoundCloud episode artwork

### Radio Channels
The radio player supports four distinct channels:
- **CH 1 - Morning Drops**: Curated morning episodes (~40 episodes)
- **CH 2 - Sedna FM**: Core Sedna FM episodes (~5 episodes)
- **CH 3 - Evening Flows**: Evening wind-down episodes (coming soon)
- **CH 4 - On The Go**: Episodes for when you're on the move (~1 episode)

### Choose Your Mood (AI-Powered) 🎵
Select your current mood and let AI recommend the perfect episode:
- **Available Moods**: Happy, Calm, Reflective, Sad, Energetic, Intimate, Moody, Carefree
- **Smart Recommendations**: Azure OpenAI analyzes episode descriptions and songs to find the best match
- **Session Memory**: Tracks played episodes per mood to avoid repetition
- **Next Button**: Get another recommendation without repeating tracks
- Memory automatically resets when browser is refreshed

### Interactive Controls
- Click any channel button to start playing from that channel
- Click the same channel again to return to all episodes mode
- Active channel is highlighted with a golden glow
- Play/Pause button with pulsing animation
- Next track button to skip to the next episode in the channel

### Visual Design
- Realistic radio interface with channel buttons
- VT323 retro font for episode titles
- Scrolling marquee for long titles
- Responsive design for desktop and mobile

## Architecture

### Frontend
- Static HTML/CSS/JavaScript hosted on GitHub Pages
- Modular JavaScript architecture (`scripts/modules/`)
- SoundCloud Widget API for audio playback

### Backend (Azure Functions)
- **Runtime**: Python 3.11
- **AI Models**:
  - **Mood Recommendations**: Azure OpenAI GPT-5 nano (`sedna-website-foundry-ch`)
  - **Daily Facts**: Azure OpenAI GPT-5.1 (`yasmi-mjc1puli-eastus2`)
- **Endpoints**:
  - `POST /api/recommend` - Mood-based episode recommendation
  - `GET /api/health` - Health check
  - `GET /api/generate-daily-fact` - Manual daily fact generation
  - `GET /api/generate-daily-fact?batch=true` - Generate 24 hourly facts
  - `GET /api/generate-daily-fact?publish=true` - Publish next fact from queue
- **Timer Triggers**:
  - `daily_batch_generator` - Runs at 00:00 UTC daily, generates 24 facts
  - `hourly_fact_publisher` - Runs every hour at :00, publishes next fact

### Environments
| Environment | Branch | API URL |
|-------------|--------|---------|
| Development | `develop` | `https://sedna-website-func-dev-ch.azurewebsites.net` |
| Production | `main` | `https://sedna-website-func-ch.azurewebsites.net` |

## Project Structure

```
.
├── index.html
├── about.html
├── api/                            # Azure Functions backend
│   ├── function_app.py             # Main function with AI recommendation
│   ├── host.json
│   ├── local.settings.json
│   └── requirements.txt
├── assets/
│   └── images/
│       ├── radio-realistic.png     # Current radio image
│       └── sedna_logo.png
├── data/
│   ├── episodes.json               # Episode catalog
│   └── daily_match.json            # Auto-updated hourly fact (committed by Azure Function)
├── scripts/
│   ├── main.js                     # Entry point
│   └── modules/
│       ├── channels.js             # Channel filtering logic
│       ├── dailyFact.js            # Daily fact display + SoundCloud artwork
│       ├── episodes.js             # Episode URL list
│       ├── modal.js                # Subscribe modal
│       ├── mood.js                 # AI mood recommendations + session memory
│       ├── player.js               # SoundCloud player logic
│       ├── ui.js                   # UI updates
│       └── utils.js                # Utility functions
├── styles/
│   └── main.css
├── specs/
│   ├── prd.md                      # Product Requirements Document
│   ├── features/                   # Feature specifications
│   └── tasks/                      # Implementation tasks
├── .github/workflows/
│   ├── deploy-function-dev.yml     # Deploy to dev on push to develop
│   └── deploy-function-prod.yml    # Deploy to prod on push to main
└── .apm/instructions/
    └── sedna-project.instructions.md  # Project context for AI assistants
```

## Development

### Prerequisites
- Node.js (for live-server)
- Python 3.11 (for Azure Functions)
- Azure Functions Core Tools (optional, for local API testing)

### Local Testing
```bash
# Frontend - from project root
live-server

# Backend - from api/ folder (requires Azure Functions Core Tools)
func start
```

### Deployment
Deployments are automatic via GitHub Actions:
1. Push to `develop` → Deploys to dev Azure Function
2. Push to `main` → Deploys to prod Azure Function

Only changes in `api/**` or `data/**` trigger function deployments.

## Best Practices

- Keep assets, styles, and scripts in their respective folders
- Modularize JavaScript code in `scripts/modules/`
- Test locally with `live-server` before committing
- Use `develop` branch for development, merge to `main` for production
- Reference project context in `.apm/instructions/sedna-project.instructions.md`