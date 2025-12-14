// Player logic for Sedna FM
import { getRandom } from './utils.js';
import { EPISODES } from './episodes.js';
import { updateArtworkAndTitle, updatePlayPauseIcon, updateChannelHighlighting, showToast } from './ui.js';
import { getChannelEpisodes, getRandomChannelEpisode, getAllEpisodes } from './channels.js';

// State
let widget = null;
let currentTrack = null;
let isPlaying = false;
let tracks = null;
let activeChannel = null; // null = all episodes, 1-4 = specific channel

// Track history for session - prevents replaying same tracks
let playedTracks = []; // All tracks played in this session
let trackHistory = []; // History stack for going back
let historyIndex = -1; // Current position in history

// Fetch episodes from module
function fetchSednaTracks() {
  return Array.isArray(EPISODES) ? EPISODES : [];
}

/**
 * Get the current active channel
 * @returns {number|null} Active channel ID or null if no channel selected
 */
function getActiveChannel() {
  return activeChannel;
}

/**
 * Set the active channel and play from it
 * @param {number} channelId - Channel ID (1-4)
 */
function setActiveChannel(channelId) {
  const channelEpisodes = getChannelEpisodes(channelId);
  
  // Handle empty channel
  if (channelEpisodes.length === 0) {
    showToast(`No episodes available in this channel yet`);
    return;
  }
  
  activeChannel = channelId;
  tracks = channelEpisodes;
  updateChannelHighlighting(activeChannel);
  
  // Play random episode from the new channel
  const randomTrack = getRandomChannelEpisode(channelId);
  if (randomTrack) {
    playTrack(randomTrack);
  }
}

/**
 * Clear active channel and return to all episodes
 */
function clearActiveChannel() {
  activeChannel = null;
  tracks = fetchSednaTracks();
  updateChannelHighlighting(null);
}

/**
 * Handle channel button click
 * @param {number} channelId - Channel ID (1-4)
 */
function handleChannelClick(channelId) {
  if (activeChannel === channelId) {
    // Same channel clicked - toggle off
    clearActiveChannel();
    // Play random from all episodes
    playRandomEpisode();
  } else {
    // Different channel - switch to it
    setActiveChannel(channelId);
  }
}

// Embed SoundCloud player for a given track URL
function embedSoundCloud(trackUrl) {
  const playerDiv = document.getElementById('soundcloud-player');
  playerDiv.innerHTML = `
    <iframe id="sc-widget-iframe" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay; encrypted-media"
      src="https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true">
    </iframe>
  `;
  playerDiv.style.display = 'block';

  setTimeout(() => {
    const iframe = document.getElementById('sc-widget-iframe');
    if (iframe) {
      widget = SC.Widget(iframe);
      widget.bind(SC.Widget.Events.PLAY, () => {
        isPlaying = true;
        updatePlayPauseIcon();
        updateArtworkAndTitle();
        // Add playing class to stop pulsing animation
        const playBtn = document.getElementById('radio-play-btn');
        if (playBtn) playBtn.classList.add('playing');
      });
      widget.bind(SC.Widget.Events.PAUSE, () => {
        isPlaying = false;
        updatePlayPauseIcon();
        // Remove playing class to start pulsing animation
        const playBtn = document.getElementById('radio-play-btn');
        if (playBtn) playBtn.classList.remove('playing');
      });
      widget.bind(SC.Widget.Events.FINISH, () => {
        isPlaying = false;
        updatePlayPauseIcon();
        // Remove playing class to start pulsing animation
        const playBtn = document.getElementById('radio-play-btn');
        if (playBtn) playBtn.classList.remove('playing');
      });
      widget.bind(SC.Widget.Events.READY, () => {
        updateArtworkAndTitle();
      });
      widget.bind(SC.Widget.Events.LOAD_PROGRESS, () => {
        updateArtworkAndTitle();
      });
    }
    // Always update artwork/title after widget is created
    updateArtworkAndTitle();
  }, 200);
}

// Play a specific track by URL
function playTrack(trackUrl) {
  if (!tracks) tracks = fetchSednaTracks();
  if (!widget || currentTrack !== trackUrl) {
    currentTrack = trackUrl;
    embedSoundCloud(trackUrl);
    setTimeout(() => {
      if (widget) {
        widget.load(trackUrl, { auto_play: true });
        // Update artwork/title after loading new track
        setTimeout(() => {
          updateArtworkAndTitle();
        }, 300);
      }
    }, 500);
  } else {
    widget.play();
  }
}

// Play a random track
function playRandomEpisode() {
  // Respect active channel if set
  if (activeChannel !== null) {
    const randomTrack = getRandomChannelEpisode(activeChannel);
    if (randomTrack) {
      playTrack(randomTrack);
    }
    return;
  }
  
  // No active channel - play from all episodes
  if (!tracks) tracks = fetchSednaTracks();
  const randomTrack = getRandom(tracks);
  playTrack(randomTrack);
}

// Play/pause toggle
function togglePlayPause() {
  if (!widget) {
    playRandomEpisode();
    return;
  }
  widget.isPaused(function(paused) {
    const playBtn = document.getElementById('radio-play-btn');
    if (paused) {
      widget.play();
      isPlaying = true;
      if (playBtn) playBtn.classList.add('playing');
    } else {
      widget.pause();
      isPlaying = false;
      if (playBtn) playBtn.classList.remove('playing');
    }
    updatePlayPauseIcon();
  });
}

/**
 * Get a random unplayed track from the given track list
 * @param {Array} trackList - List of tracks to choose from
 * @returns {string|null} Random unplayed track URL or null if all played
 */
function getRandomUnplayedTrack(trackList) {
  // Filter out already played tracks
  const unplayedTracks = trackList.filter(track => !playedTracks.includes(track));
  
  // If all tracks have been played, reset and start fresh
  if (unplayedTracks.length === 0) {
    // Reset played tracks but keep current track to avoid immediate repeat
    playedTracks = currentTrack ? [currentTrack] : [];
    const freshTracks = trackList.filter(track => track !== currentTrack);
    return freshTracks.length > 0 ? getRandom(freshTracks) : trackList[0];
  }
  
  return getRandom(unplayedTracks);
}

/**
 * Add track to history and played list
 * @param {string} trackUrl - Track URL to add
 */
function addToHistory(trackUrl) {
  // If we're not at the end of history, truncate forward history
  if (historyIndex < trackHistory.length - 1) {
    trackHistory = trackHistory.slice(0, historyIndex + 1);
  }
  
  trackHistory.push(trackUrl);
  historyIndex = trackHistory.length - 1;
  
  // Add to played tracks if not already there
  if (!playedTracks.includes(trackUrl)) {
    playedTracks.push(trackUrl);
  }
}

// Next track - plays a RANDOM unplayed track
function playNextTrack() {
  let nextTrack;
  
  // Respect active channel if set
  if (activeChannel !== null) {
    const channelTracks = getChannelEpisodes(activeChannel);
    if (channelTracks.length === 0) return;
    
    nextTrack = getRandomUnplayedTrack(channelTracks);
  } else {
    // No active channel - play random from all episodes
    if (!tracks) tracks = fetchSednaTracks();
    nextTrack = getRandomUnplayedTrack(tracks);
  }
  
  if (nextTrack) {
    addToHistory(nextTrack);
    playTrack(nextTrack);
  }
}

// Previous track - goes back in history
function playPreviousTrack() {
  // Can't go back if at the beginning or no history
  if (historyIndex <= 0 || trackHistory.length === 0) {
    showToast('No previous track');
    return;
  }
  
  historyIndex--;
  const previousTrack = trackHistory[historyIndex];
  playTrack(previousTrack);
}

// Export functions and state as needed
export {
  playTrack,
  playRandomEpisode,
  togglePlayPause,
  playNextTrack,
  playPreviousTrack,
  fetchSednaTracks,
  embedSoundCloud,
  handleChannelClick,
  getActiveChannel,
  setActiveChannel,
  clearActiveChannel,
  widget,
  currentTrack,
  isPlaying
};