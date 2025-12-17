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

// Next track
function playNextTrack() {
  // Respect active channel if set
  if (activeChannel !== null) {
    const channelTracks = getChannelEpisodes(activeChannel);
    if (channelTracks.length === 0) return;
    
    let nextTrack;
    if (channelTracks.length <= 1) {
      nextTrack = channelTracks[0];
    } else {
      const idx = channelTracks.indexOf(currentTrack);
      if (idx === -1 || idx === channelTracks.length - 1) {
        nextTrack = channelTracks[0];
      } else {
        nextTrack = channelTracks[idx + 1];
      }
    }
    playTrack(nextTrack);
    return;
  }
  
  // No active channel - play from all episodes
  if (!tracks) tracks = fetchSednaTracks();
  let nextTrack;
  if (tracks.length <= 1) {
    nextTrack = tracks[0];
  } else {
    const idx = tracks.indexOf(currentTrack);
    if (idx === -1 || idx === tracks.length - 1) {
      nextTrack = tracks[0];
    } else {
      nextTrack = tracks[idx + 1];
    }
  }
  playTrack(nextTrack);
}

// Export functions and state as needed
export {
  playTrack,
  playRandomEpisode,
  togglePlayPause,
  playNextTrack,
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