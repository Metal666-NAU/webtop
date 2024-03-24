const desktop = document.getElementById("desktop");
const windowsContainer = document.getElementById("windows-container");
const taskbarIconsContainer = document.getElementById(
	"taskbar-icons-container"
);
/** @type {HTMLTemplateElement} */
const windowFrameTemplate = document.getElementById("window-frame-template");
/** @type {HTMLTemplateElement} */
const taskbarIconTemplate = document.getElementById("taskbar-icon-template");

class WindowFrame {
	/**
	 * @param {string} windowName
	 */
	constructor(windowName) {
		/** @type {DocumentFragment} */
		const documentFragment = windowFrameTemplate.content.cloneNode(true);

		const name = documentFragment.querySelector(".window-name");
		/** @type {HTMLIFrameElement} */
		const content = documentFragment.querySelector(".window-content");

		content.src = `/windows/${windowName}.html`;
		content.addEventListener("load", () => {
			name.innerText = content.contentDocument.title;
		});

		/** @type {HTMLButtonElement} */
		const closeButton = documentFragment.querySelector(
			".window-close-button"
		);

		// hack-ish solution to prevent dragging the window when close button is clicked
		closeButton.addEventListener("mousedown", (event) =>
			event.stopPropagation()
		);

		/** @type {Vector2} */
		this.grabOffset = null;
		this.documentFragment = documentFragment;
		this.frame = documentFragment.querySelector(".window-frame");
		this.titlebar = documentFragment.querySelector(".window-titlebar");
		this.icon = documentFragment.querySelector(".window-icon");
		this.name = name;
		this.content = content;
		this.closeButton = closeButton;
	}
}

class TaskbarIcon {
	constructor() {
		/** @type {DocumentFragment} */
		const documentFragment = taskbarIconTemplate.content.cloneNode(true);

		/** @type {HTMLElement} */
		const icon = documentFragment.querySelector(".taskbar-icon");

		this.documentFragment = documentFragment;
		this.container = documentFragment.querySelector(
			".taskbar-icon-container"
		);
		this.icon = icon;
	}
}

/** @type {Array<WindowFrame>} */
const windowFrames = [];
/** @type {Array<TaskbarIcon>} */
const taskbarIcons = [];

/** @type {WindowFrame} */
let draggedWindow = null;

function openWindow(name) {
	const windowFrame = new WindowFrame(name);

	const index = windowFrames.push(windowFrame) - 1;
	windowsContainer.appendChild(windowFrame.documentFragment);

	const taskbarIcon = new TaskbarIcon();

	taskbarIcons.push(taskbarIcon);
	taskbarIconsContainer.appendChild(taskbarIcon.documentFragment);

	windowFrame.titlebar.addEventListener("mousedown", (event) => {
		draggedWindow = windowFrame;
		draggedWindow.grabOffset = {
			x: event.offsetX,
			y: event.offsetY,
		};

		windowFrame.content.style.pointerEvents = "none";
	});

	windowFrame.closeButton.addEventListener("click", (event) =>
		closeWindow(index)
	);

	windowFrame.content.addEventListener("load", (event) => {
		windowFrame.content.contentWindow.postMessage({
			action: "set-index",
			index: index,
		});
	});
}

/** @param {WindowFrame} windowFrame */
function closeWindow(index) {
	const windowFrame = windowFrames.splice(index, 1)[0];
	windowsContainer.removeChild(windowFrame.frame);

	const taskbarIcon = taskbarIcons.splice(index, 1)[0];
	taskbarIconsContainer.removeChild(taskbarIcon.container);
}

addEventListener("mousemove", (event) => {
	if (!draggedWindow) {
		return;
	}

	const frame = draggedWindow.frame;
	const offset = draggedWindow.grabOffset;

	frame.style.left = `${clamp(
		event.clientX - offset.x,
		0,
		desktop.clientWidth - frame.clientWidth
	)}px`;
	frame.style.top = `${clamp(
		event.clientY - offset.y,
		0,
		desktop.clientHeight - frame.clientHeight
	)}px`;
});

addEventListener("mouseup", () => {
	if (!draggedWindow) {
		return;
	}

	draggedWindow.content.style.pointerEvents = "auto";
	draggedWindow = null;
});

setupMessageHandler(window, [
	{
		action: "set-icon",
		handler: (data) => {
			windowFrames[data.index].icon.innerText = data.icon;
			taskbarIcons[data.index].icon.innerText = data.icon;
		},
	},
]);

openWindow("settings");
