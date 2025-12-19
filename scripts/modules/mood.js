// Mood selector module for Sedna FM
// Connects mood buttons to Azure AI recommendation API

// Production branch - always use production API
const API_URL = 'https://sedna-website-func-ch.azurewebsites.net/api/recommend';

// Session storage key for tracking played episodes
const SESSION_STORAGE_KEY = 'sedna_played_episodes';

// State
let currentMoodEpisode = null;
let moodWidget = null;
let isMoodPlaying = false;
let currentMood = null;

/**
 * Get played episodes from session storage
 * @returns {Object} - Object with mood keys and arrays of played episode IDs
 */
function getPlayedEpisodes() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.warn('Error reading session storage:', e);
    return {};
  }
}

/**
 * Save played episodes to session storage
 * @param {Object} playedEpisodes - Object with mood keys and arrays of played episode IDs
 */
function savePlayedEpisodes(playedEpisodes) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(playedEpisodes));
  } catch (e) {
    console.warn('Error saving to session storage:', e);
  }
}

/**
 * Add an episode to the played list for a specific mood
 * @param {string} mood - The mood category
 * @param {number} episodeId - The episode ID that was played
 */
function addPlayedEpisode(mood, episodeId) {
  const playedEpisodes = getPlayedEpisodes();
  
  if (!playedEpisodes[mood]) {
    playedEpisodes[mood] = [];
  }
  
  // Only add if not already in the list
  if (!playedEpisodes[mood].includes(episodeId)) {
    playedEpisodes[mood].push(episodeId);
    savePlayedEpisodes(playedEpisodes);
  }
}

/**
 * Get the list of episode IDs to exclude for a specific mood
 * @param {string} mood - The mood category
 * @returns {number[]} - Array of episode IDs to exclude
 */
function getExcludedEpisodes(mood) {
  const playedEpisodes = getPlayedEpisodes();
  return playedEpisodes[mood] || [];
}

/**
 * Clear played episodes for a specific mood (useful when all episodes have been played)
 * @param {string} mood - The mood category to clear
 */
function clearPlayedEpisodesForMood(mood) {
  const playedEpisodes = getPlayedEpisodes();
  playedEpisodes[mood] = [];
  savePlayedEpisodes(playedEpisodes);
}

/**
 * Request an episode recommendation based on mood
 * @param {string} mood - The selected mood
 * @param {number[]} excludeEpisodes - Array of episode IDs to exclude from recommendation
 * @returns {Promise<Object>} - The recommended episode
 */
async function getRecommendation(mood, excludeEpisodes = []) {
  // Capitalize first letter to match API expectations
  const capitalizedMood = mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase();
  
  console.log(`[Mood] Requesting recommendation for "${capitalizedMood}" excluding episodes:`, excludeEpisodes);
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      mood: capitalizedMood,
      exclude: excludeEpisodes 
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();
  console.log(`[Mood] Received episode ID: ${result.episode?.id}, Title: "${result.episode?.title}", Memory reset: ${result.memoryReset}`);
  return result;
}

/**
 * Update the mood player UI with episode info
 * @param {Object} episode - The episode object
 * @param {string} reason - AI's reason for recommendation
 */
function updateMoodPlayerUI(episode, reason) {
  const titleEl = document.getElementById('mood-player-title');
  const artistEl = document.getElementById('mood-player-artist');
  const descriptionEl = document.getElementById('mood-episode-description');
  
  if (titleEl) titleEl.textContent = episode.title;
  if (artistEl) artistEl.textContent = 'Sedna FM';
  
  if (descriptionEl) {
    descriptionEl.innerHTML = `
      <p class="mood-recommendation-reason"><em>"${reason}"</em></p>
      <p>${episode.description}</p>
    `;
  }
}

/**
 * Create and embed the mood SoundCloud player
 * @param {string} trackUrl - SoundCloud URL
 * @param {boolean} autoPlay - Whether to auto-play the track
 */
function embedMoodPlayer(trackUrl, autoPlay = false) {
  // Reset widget reference before creating new one
  moodWidget = null;
  
  // Create a hidden iframe for the mood player
  let moodPlayerContainer = document.getElementById('mood-soundcloud-player');
  
  if (!moodPlayerContainer) {
    moodPlayerContainer = document.createElement('div');
    moodPlayerContainer.id = 'mood-soundcloud-player';
    moodPlayerContainer.style.display = 'none';
    document.body.appendChild(moodPlayerContainer);
  }
  
  const autoPlayParam = autoPlay ? 'true' : 'false';
  moodPlayerContainer.innerHTML = `
    <iframe id="mood-sc-widget-iframe" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay; encrypted-media"
      src="https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=${autoPlayParam}&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true">
    </iframe>
  `;

  setTimeout(() => {
    const iframe = document.getElementById('mood-sc-widget-iframe');
    if (iframe && typeof SC !== 'undefined') {
      moodWidget = SC.Widget(iframe);
      
      moodWidget.bind(SC.Widget.Events.READY, () => {
        // If auto-play is enabled, also call play() to ensure it starts
        if (autoPlay) {
          moodWidget.play();
        }
        updateMoodPlayButtonIcon();
        // Fetch and display episode artwork
        moodWidget.getCurrentSound((sound) => {
          if (sound && sound.artwork_url) {
            updateMoodArtwork(sound.artwork_url);
          }
        });
      });
      
      moodWidget.bind(SC.Widget.Events.PLAY, () => {
        isMoodPlaying = true;
        updateMoodPlayButtonIcon();
      });
      
      moodWidget.bind(SC.Widget.Events.PAUSE, () => {
        isMoodPlaying = false;
        updateMoodPlayButtonIcon();
      });
      
      moodWidget.bind(SC.Widget.Events.FINISH, () => {
        isMoodPlaying = false;
        updateMoodPlayButtonIcon();
      });
    }
  }, 300);
}

/**
 * Update the mood play button icon
 */
function updateMoodPlayButtonIcon() {
  const btn = document.getElementById('mood-play-btn');
  if (!btn) return;
  
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = isMoodPlaying ? 'fas fa-pause' : 'fas fa-play';
  }
}

/**
 * Update the mood player artwork with episode artwork from SoundCloud
 * @param {string} artworkUrl - SoundCloud artwork URL
 */
function updateMoodArtwork(artworkUrl) {
  const artworkImg = document.getElementById('mood-player-artwork-img');
  if (!artworkImg) return;
  
  // SoundCloud returns small artwork by default (100x100)
  // Replace 'large' with 't500x500' for higher resolution
  const highResUrl = artworkUrl.replace('-large', '-t500x500');
  
  artworkImg.src = highResUrl;
  artworkImg.alt = currentMoodEpisode ? currentMoodEpisode.title : 'Episode artwork';
}

/**
 * Toggle play/pause for mood player
 */
function toggleMoodPlayPause() {
  if (!moodWidget || !currentMoodEpisode) {
    console.warn('No episode loaded for mood player');
    return;
  }
  
  if (isMoodPlaying) {
    moodWidget.pause();
  } else {
    moodWidget.play();
  }
}

/**
 * Handle mood button click
 * @param {string} mood - The selected mood
 */
async function handleMoodClick(mood) {
  // Store the current mood for next button functionality
  currentMood = mood;
  
  // Stop any currently playing track and reset state before loading new one
  if (moodWidget) {
    try {
      moodWidget.pause();
    } catch (e) {
      // Widget might not be fully initialized, ignore
    }
  }
  isMoodPlaying = false;
  updateMoodPlayButtonIcon();
  
  // Update UI to show loading state
  const titleEl = document.getElementById('mood-player-title');
  const descriptionEl = document.getElementById('mood-episode-description');
  
  if (titleEl) titleEl.textContent = 'Finding the perfect episode...';
  if (descriptionEl) descriptionEl.innerHTML = '<p>Our aliens are selecting the best episode for your mood...</p>';
  
  // Highlight the selected mood button
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mood === mood) {
      btn.classList.add('active');
    }
  });

  try {
    // Get list of already played episodes for this mood
    const excludeEpisodes = getExcludedEpisodes(mood);
    
    const result = await getRecommendation(mood, excludeEpisodes);
    
    if (result.episode) {
      currentMoodEpisode = result.episode;
      
      // Track this episode as played for the current mood
      addPlayedEpisode(mood, result.episode.id);
      
      // Check if memory was reset (all episodes played)
      if (result.memoryReset) {
        clearPlayedEpisodesForMood(mood);
        // Re-add the current episode since it's now playing
        addPlayedEpisode(mood, result.episode.id);
      }
      
      // Update UI with episode info
      updateMoodPlayerUI(result.episode, result.reason);
      
      // Embed the SoundCloud player with auto-play enabled
      embedMoodPlayer(result.episode.soundcloudUrl, true);
    } else {
      throw new Error('No episode returned');
    }
  } catch (error) {
    console.error('Error getting recommendation:', error);
    if (titleEl) titleEl.textContent = 'Error loading recommendation';
    if (descriptionEl) {
      descriptionEl.innerHTML = '<p>Sorry, we couldn\'t get a recommendation right now. Please try again.</p>';
    }
  }
}

/**
 * Handle next button click - get another recommendation for the same mood
 */
function handleNextClick() {
  if (!currentMood) {
    console.warn('No mood selected. Please select a mood first.');
    return;
  }
  
  // Re-trigger the mood recommendation with the same mood
  handleMoodClick(currentMood);
}

/**
 * Initialize mood selector functionality
 */
function initMoodSelector() {
  // Attach click handlers to mood buttons
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      handleMoodClick(mood);
    });
  });
  
  // Attach click handler to mood play button
  const moodPlayBtn = document.getElementById('mood-play-btn');
  if (moodPlayBtn) {
    moodPlayBtn.addEventListener('click', toggleMoodPlayPause);
  }
  
  // Attach click handler to mood next button
  const moodNextBtn = document.getElementById('mood-next-btn');
  if (moodNextBtn) {
    moodNextBtn.addEventListener('click', handleNextClick);
  }
}

export {
  initMoodSelector,
  handleMoodClick,
  handleNextClick,
  toggleMoodPlayPause,
  getRecommendation
};
