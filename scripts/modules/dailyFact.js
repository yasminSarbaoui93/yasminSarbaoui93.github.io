// Daily Fact & Match module for Sedna FM
// Fetches today's fact and recommended episode, handles playback

// State
let dailyFactEpisode = null;
let dailyFactWidget = null;
let isDailyFactPlaying = false;

/**
 * Fetch the daily match data from the JSON file
 * @returns {Promise<Object|null>} The daily match data or null if failed
 */
async function fetchDailyMatch() {
  try {
    // Add cache-busting query parameter based on today's date
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`data/daily_match.json?v=${today}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[DailyFact] Error fetching daily match:', error);
    return null;
  }
}

/**
 * Update the daily fact UI with the fetched data
 * @param {Object} data - The daily match data
 */
function updateDailyFactUI(data) {
  const titleEl = document.getElementById('daily-fact-title');
  const yearEl = document.getElementById('daily-fact-year');
  const textEl = document.getElementById('daily-fact-text');
  const reasonEl = document.getElementById('daily-fact-match-reason');
  const artworkEl = document.getElementById('daily-fact-artwork-img');
  
  if (data.episode) {
    dailyFactEpisode = data.episode;
    
    if (titleEl) {
      titleEl.textContent = data.episode.title;
    }
    
    // Try to set artwork based on episode type
    if (artworkEl) {
      const episodeTitle = data.episode.title.toLowerCase();
      let artworkSrc = 'assets/images/sedna_logo.png';
      
      if (episodeTitle.includes('morning drops')) {
        artworkSrc = 'assets/images/morning-drops-image.jpg';
      } else if (episodeTitle.includes('evening flows')) {
        artworkSrc = 'assets/images/evening-flows-image.png';
      } else if (episodeTitle.includes('on the go')) {
        artworkSrc = 'assets/images/on-the-go-image.jpeg';
      } else if (episodeTitle.includes('sedna fm')) {
        artworkSrc = 'assets/images/sednafm-episode-image.jpeg';
      }
      
      artworkEl.src = artworkSrc;
      artworkEl.alt = data.episode.title;
    }
  }
  
  if (yearEl && data.fact_year) {
    yearEl.textContent = data.fact_year;
  }
  
  if (textEl && data.fact_text) {
    // Clear existing content
    textEl.innerHTML = '';
    
    // Add the fact text
    const textSpan = document.createElement('span');
    textSpan.textContent = data.fact_text + ' ';
    textEl.appendChild(textSpan);
    
    // Add "Read more" link if Wikipedia URL is available
    if (data.fact_wikipedia_url) {
      const readMoreLink = document.createElement('a');
      readMoreLink.href = data.fact_wikipedia_url;
      readMoreLink.textContent = 'Read more';
      readMoreLink.target = '_blank';
      readMoreLink.rel = 'noopener noreferrer';
      readMoreLink.className = 'daily-fact-read-more';
      textEl.appendChild(readMoreLink);
    }
  }
  
  if (reasonEl && data.match_reason) {
    reasonEl.textContent = `"${data.match_reason}"`;
  }
}

/**
 * Create and embed the SoundCloud player for the daily fact episode
 * @param {string} trackUrl - SoundCloud URL
 * @param {boolean} autoPlay - Whether to auto-play the track
 */
function embedDailyFactPlayer(trackUrl, autoPlay = false) {
  // Reset widget reference before creating new one
  dailyFactWidget = null;
  
  let playerContainer = document.getElementById('daily-fact-soundcloud-player');
  
  if (!playerContainer) {
    playerContainer = document.createElement('div');
    playerContainer.id = 'daily-fact-soundcloud-player';
    playerContainer.style.display = 'none';
    document.body.appendChild(playerContainer);
  }
  
  // Clear existing player
  playerContainer.innerHTML = '';
  
  // Create iframe for SoundCloud widget
  const iframe = document.createElement('iframe');
  iframe.id = 'daily-fact-sc-iframe';
  iframe.width = '100%';
  iframe.height = '166';
  iframe.scrolling = 'no';
  iframe.frameBorder = 'no';
  iframe.allow = 'autoplay';
  iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=${autoPlay}&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  
  playerContainer.appendChild(iframe);
  
  // Initialize widget API after iframe loads
  iframe.onload = () => {
    if (typeof SC !== 'undefined' && SC.Widget) {
      dailyFactWidget = SC.Widget(iframe);
      
      // Bind events
      dailyFactWidget.bind(SC.Widget.Events.PLAY, () => {
        isDailyFactPlaying = true;
        updateDailyFactPlayButton();
      });
      
      dailyFactWidget.bind(SC.Widget.Events.PAUSE, () => {
        isDailyFactPlaying = false;
        updateDailyFactPlayButton();
      });
      
      dailyFactWidget.bind(SC.Widget.Events.FINISH, () => {
        isDailyFactPlaying = false;
        updateDailyFactPlayButton();
      });
      
      // Update progress bar
      dailyFactWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
        const progressBar = document.getElementById('daily-fact-progress-bar');
        if (progressBar && data.relativePosition) {
          progressBar.style.width = `${data.relativePosition * 100}%`;
        }
      });
      
      console.log('[DailyFact] SoundCloud widget initialized');
    }
  };
}

/**
 * Update the play/pause button icon
 */
function updateDailyFactPlayButton() {
  const playBtn = document.getElementById('daily-fact-play-btn');
  if (!playBtn) return;
  
  const icon = playBtn.querySelector('i');
  if (icon) {
    icon.className = isDailyFactPlaying ? 'fas fa-pause' : 'fas fa-play';
  }
  
  // Toggle playing class for styling
  playBtn.classList.toggle('playing', isDailyFactPlaying);
}

/**
 * Toggle play/pause for the daily fact episode
 */
function toggleDailyFactPlayPause() {
  if (!dailyFactWidget) {
    // First time playing - embed the player
    if (dailyFactEpisode && dailyFactEpisode.soundcloudUrl) {
      embedDailyFactPlayer(dailyFactEpisode.soundcloudUrl, true);
    }
    return;
  }
  
  dailyFactWidget.toggle();
}

/**
 * Initialize the daily fact feature
 */
export async function initDailyFact() {
  console.log('[DailyFact] Initializing daily fact feature');
  
  // Fetch and display the daily match
  const data = await fetchDailyMatch();
  
  if (data) {
    updateDailyFactUI(data);
    
    // Pre-load the player (but don't auto-play)
    if (data.episode && data.episode.soundcloudUrl) {
      embedDailyFactPlayer(data.episode.soundcloudUrl, false);
    }
    
    console.log('[DailyFact] Daily fact loaded:', data.fact_text?.substring(0, 50) + '...');
  } else {
    // Show error state
    const textEl = document.getElementById('daily-fact-text');
    if (textEl) {
      textEl.textContent = 'Unable to load today\'s fact. Please try again later.';
    }
    console.warn('[DailyFact] Failed to load daily match data');
  }
  
  // Set up play button click handler
  const playBtn = document.getElementById('daily-fact-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', toggleDailyFactPlayPause);
  }
}

// Export for use in main.js
export { fetchDailyMatch, toggleDailyFactPlayPause };
