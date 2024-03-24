/**
 * @typedef MessageHandler
 * @property {string} action
 * @property {Function} handler
 */

/**
 * @param {Window} window
 * @param {Array<MessageHandler>} handlers
 */
function setupMessageHandler(window, handlers) {
	window.addEventListener("message", (event) => {
		const data = event.data;

		if (data.action === undefined) {
			return;
		}

		const handlerMatches = handlers.filter(
			(handler) => handler.action === data.action
		);

		if (handlerMatches.length === 0) {
			// normally an error should be logged here, but because I'm using the
			// Live Preview extension, some weird things ocasionally happen and
			// this code executes when it shouldn't, logging a false error :(

			// console.error(`Received unknown message!\n${JSON.stringify(data)}`);

			return;
		}

		handlerMatches.forEach((handler) => handler.handler(data));
	});
}
