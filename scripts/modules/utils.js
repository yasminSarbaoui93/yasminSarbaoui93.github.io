// Utility functions for Sedna FM

/**
 * Get a random element from an array.
 * @param {Array} arr
 * @returns {*}
 */
export function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}