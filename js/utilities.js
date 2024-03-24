/**
 * @typedef {Object} Vector2
 * @property {number} x
 * @property {number} y
 */

function clamp(num, min, max) {
	return Math.min(Math.max(num, min), max);
}
