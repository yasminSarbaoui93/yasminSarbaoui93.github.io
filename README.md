# yasminSarbaoui93.github.io

## Sedna FM - A Radio Show from Another Planet

Sedna FM is an interactive radio player website featuring curated episode channels and a retro radio interface.

## Features

### Radio Channels
The radio player supports four distinct channels:
- **CH 1 - Morning Drops**: Curated morning episodes (~40 episodes)
- **CH 2 - Sedna FM**: Core Sedna FM episodes (~5 episodes)
- **CH 3 - Evening Flows**: Evening wind-down episodes (coming soon)
- **CH 4 - On The Go**: Episodes for when you're on the move (~1 episode)

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

## Project Structure

```
.
├── about.html
├── index.html
├── assets/
│   └── images/
│       ├── ale1.jpeg
│       ├── gaia1.PNG
│       ├── hero-background.png
│       ├── io e gaia 1.jpg
│       ├── io e gaia 2.jpg
│       ├── radio-realistic.png     # Current radio image
│       ├── radio-(old)-unused.png  # Previous radio image (archived)
│       ├── sedna_logo.png
│       └── yaya1.PNG
├── styles/
│   └── main.css
├── scripts/
│   ├── main.js                     # Entry point
│   └── modules/
│       ├── channels.js             # Channel filtering logic
│       ├── episodes.js             # Episode URL list
│       ├── modal.js                # Subscribe modal
│       ├── player.js               # SoundCloud player logic
│       ├── ui.js                   # UI updates (icons, titles, highlights)
│       └── utils.js                # Utility functions
├── specs/
│   ├── prd.md                      # Product Requirements Document
│   ├── features/                   # Feature specifications
│   └── tasks/                      # Implementation tasks
├── CNAME
└── README.md
```

### Folder Descriptions

- **assets/images/**: Contains all image assets used in the project. Organizing images here keeps the project tidy and makes asset management easier.
- **styles/**: Place all CSS files here. This separation allows for scalable and maintainable styling.
- **scripts/**: Place all JavaScript files here. Keeping scripts modular supports reusability and easier debugging.
- **about.html, index.html**: Main HTML files for the site.
- **CNAME**: Custom domain configuration for GitHub Pages.
- **README.md**: Project documentation.

### Best Practices

- Keep assets, styles, and scripts in their respective folders for clarity and maintainability.
- Reference images in HTML as `assets/images/filename.ext`.
- Add new CSS and JS files to the `styles/` and `scripts/` folders as the project grows.
- Modularize code and assets to support collaboration and future expansion.

# Test
Before committing, test changes with the command
```bash
live-server
```