/**
 * Channel filtering module for Sedna FM
 * Categorizes episodes into distinct radio channels based on URL patterns
 * 
 * @module channels
 */

import { EPISODES } from './episodes.js';
import { getRandom } from './utils.js';

/**
 * Channel configuration with filtering rules
 * @type {Object.<number, {id: number, name: string, description: string, pattern: string|null, excludePatterns: string[]}>}
 */
export const CHANNELS = {
  1: {
    id: 1,
    name: 'Morning Drops',
    description: 'Start your day with Morning Drops episodes',
    pattern: '/morning-drops',
    excludePatterns: []
  },
  2: {
    id: 2,
    name: 'Sedna FM',
    description: 'Core Sedna FM episodes',
    pattern: null, // No specific pattern - uses exclusion logic
    excludePatterns: ['/morning-drops', '/on-the-go', '/evening-flows']
  },
  3: {
    id: 3,
    name: 'Evening Flows',
    description: 'Wind down with Evening Flows episodes',
    pattern: '/evening-flows',
    excludePatterns: []
  },
  4: {
    id: 4,
    name: 'On The Go',
    description: 'Episodes for when you are on the move',
    pattern: '/on-the-go',
    excludePatterns: []
  }
};

/**
 * Get all episodes (unfiltered)
 * @returns {string[]} Array of all episode URLs
 */
export function getAllEpisodes() {
  return EPISODES;
}

/**
 * Get episodes filtered by channel ID
 * @param {number} channelId - Channel ID (1-4)
 * @returns {string[]} Array of episode URLs for the channel
 */
export function getChannelEpisodes(channelId) {
  const channel = CHANNELS[channelId];
  
  // Invalid channel ID - return empty array
  if (!channel) {
    console.warn(`Invalid channel ID: ${channelId}`);
    return [];
  }
  
  // Channel 2 (Sedna FM) uses exclusion logic
  if (channel.pattern === null && channel.excludePatterns.length > 0) {
    return EPISODES.filter(url => {
      const lowerUrl = url.toLowerCase();
      return !channel.excludePatterns.some(pattern => 
        lowerUrl.includes(pattern.toLowerCase())
      );
    });
  }
  
  // Other channels use inclusion pattern
  if (channel.pattern) {
    return EPISODES.filter(url => 
      url.toLowerCase().includes(channel.pattern.toLowerCase())
    );
  }
  
  // Fallback - return all episodes
  return EPISODES;
}

/**
 * Get a random episode from a specific channel
 * @param {number} channelId - Channel ID (1-4), or null/undefined for all episodes
 * @returns {string|null} Random episode URL or null if channel is empty
 */
export function getRandomChannelEpisode(channelId) {
  // No channel specified - return random from all episodes
  if (channelId === null || channelId === undefined) {
    return getRandom(EPISODES);
  }
  
  const episodes = getChannelEpisodes(channelId);
  
  // Empty channel
  if (episodes.length === 0) {
    console.warn(`Channel ${channelId} has no episodes`);
    return null;
  }
  
  return getRandom(episodes);
}

/**
 * Get channel metadata by ID
 * @param {number} channelId - Channel ID (1-4)
 * @returns {Object|null} Channel info object or null if not found
 */
export function getChannelInfo(channelId) {
  return CHANNELS[channelId] || null;
}

/**
 * Get count of episodes in a channel
 * @param {number} channelId - Channel ID (1-4)
 * @returns {number} Number of episodes in the channel
 */
export function getChannelEpisodeCount(channelId) {
  return getChannelEpisodes(channelId).length;
}

/**
 * Validate that all episodes are categorized correctly
 * Logs channel counts for debugging
 * @returns {Object} Object with channel counts and validation status
 */
export function validateChannelCounts() {
  const counts = {
    ch1: getChannelEpisodeCount(1),
    ch2: getChannelEpisodeCount(2),
    ch3: getChannelEpisodeCount(3),
    ch4: getChannelEpisodeCount(4),
    total: EPISODES.length
  };
  
  // Note: Episodes can only belong to one channel, so sum should equal total
  // CH2 contains episodes NOT in other channels, so sum should match
  const sum = counts.ch1 + counts.ch2 + counts.ch3 + counts.ch4;
  counts.sum = sum;
  counts.valid = sum === counts.total;
  
  console.log('Channel Episode Counts:', counts);
  
  return counts;
}
