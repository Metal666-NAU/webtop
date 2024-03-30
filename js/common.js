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
	wallpaperFit: "wallpaper-fit",
	taskbarWidth: "taskbar-width",
	clockShowSeconds: "clock-show-seconds",
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

/**
 * @param {string} path
 * @returns {Promise<FileSystemDirectoryHandle | null>}
 */
async function openDirectory(path) {
	path = path.replace(/^\//, "");

	const pathSegments = path.split("/");

	/** @type {FileSystemDirectoryHandle} */
	let currentDirectory = null;

	try {
		currentDirectory = await navigator.storage.getDirectory();

		for (const pathSegment of pathSegments) {
			currentDirectory = await currentDirectory.getDirectoryHandle(
				pathSegment
			);
		}
	} catch (exception) {
		console.error(`Failed to open folder: ${exception.message}`);

		return null;
	}

	return currentDirectory;
}

/**
 * @param {string} path
 * @returns {Promise<FileSystemFileHandle | null>}
 */
async function loadFile(path, create) {
	console.log(`Loading file @ '${path}' (create: ${create}).`);

	path = path.replace(/^\//, "");

	const filePath = splitFilePath(path);

	const directory = await (filePath.directoryPath
		? await openDirectory(filePath.directoryPath)
		: navigator.storage.getDirectory());

	if (!directory) {
		return null;
	}

	try {
		return await directory.getFileHandle(filePath.fileName, {
			create: create,
		});
	} catch (exception) {
		console.error(`Failed to load file: ${exception.message}`);

		return null;
	}
}

/**
 * @param {string} path
 * @returns {{directoryPath: string, fileName: string}}
 */
function splitFilePath(path) {
	const fileAndDirectorySeparatorIndex = path.lastIndexOf("/");

	return {
		directoryPath: path.substring(0, fileAndDirectorySeparatorIndex),
		fileName: path.substring(fileAndDirectorySeparatorIndex + 1),
	};
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

let taskbarWidth = localStorage.getItem(settingKeys.taskbarWidth);

if (!taskbarWidth) {
	localStorage.setItem(settingKeys.taskbarWidth, 60);
}

let clockShowSeconds = localStorage.getItem(settingKeys.clockShowSeconds);

if (!clockShowSeconds) {
	localStorage.setItem(settingKeys.clockShowSeconds, true);
}

updateAccentColor(accentColor);
updateOnAccentColor(onAccentColor);
