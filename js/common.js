/**
 * @typedef MessageHandler
 * @property {string} action
 * @property {Function} handler
 */

const settingKeys = {
	username: "username",
	password: "password",
	accentColor: "accent-color",
	onAccentColor: "on-accent-color",
	wallpaper: "wallpaper",
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

// Have to use uppercase N here since "username" is already a variable in scripts.js :(
let userName = localStorage.getItem(settingKeys.username);

if (!userName) {
	localStorage.setItem(settingKeys.username, "<user>");
}

let accentColor = localStorage.getItem(settingKeys.accentColor);

if (!accentColor) {
	localStorage.setItem(settingKeys.accentColor, (accentColor = "#cba6f7"));
}

let onAccentColor = localStorage.getItem(settingKeys.onAccentColor);

if (!onAccentColor) {
	localStorage.setItem(
		settingKeys.onAccentColor,
		(onAccentColor = "var(--text)")
	);
}

updateAccentColor(accentColor);
updateOnAccentColor(onAccentColor);
