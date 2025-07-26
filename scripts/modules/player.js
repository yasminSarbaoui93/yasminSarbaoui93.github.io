// Player logic for Sedna FM
import { getRandom } from './utils.js';
import { EPISODES } from './episodes.js';
import { updateArtworkAndTitle, updatePlayPauseIcon } from './ui.js';

// State
let widget = null;
let currentTrack = null;
let isPlaying = false;
let tracks = null;

// Fetch episodes from module
function fetchSednaTracks() {
  return Array.isArray(EPISODES) ? EPISODES : [];
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
      });
      widget.bind(SC.Widget.Events.PAUSE, () => {
        isPlaying = false;
        updatePlayPauseIcon();
      });
      widget.bind(SC.Widget.Events.FINISH, () => {
        isPlaying = false;
        updatePlayPauseIcon();
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
    if (paused) {
      widget.play();
    } else {
      widget.pause();
    }
  });
}

// Next track
function playNextTrack() {
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
  widget,
  currentTrack,
  isPlaying
};