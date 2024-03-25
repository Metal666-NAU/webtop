/**
 * @typedef MessageHandler
 * @property {string} action
 * @property {Function} handler
 */

const settingKeys = {
	accentColor: "accent-color",
	onAccentColor: "on-accent-color",
};

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

/** @type {string} */
function updateAccentColor(accentColor) {
	document.documentElement.style.setProperty("--accent-color", accentColor);
}

/** @type {string} */
function updateOnAccentColor(onAccentColor) {
	document.documentElement.style.setProperty(
		"--on-accent-color",
		onAccentColor
	);
}

addEventListener("storage", (event) => {
	switch (event.key) {
		case settingKeys.accentColor: {
			updateAccentColor(event.newValue);

			break;
		}
		case settingKeys.onAccentColor: {
			updateOnAccentColor(event.newValue);

			break;
		}
	}
});

updateAccentColor(localStorage.getItem(settingKeys.accentColor) ?? "#cba6f7");
updateOnAccentColor(
	localStorage.getItem(settingKeys.onAccentColor) ?? "var(--text)"
);
