const desktop = document.getElementById("desktop");
const startMenu = document.getElementById("start-menu");
/** @type {HTMLTableElement} */
const startMenuApps = document.getElementById("start-menu-apps");
const startButton = document.getElementById("start-button");
const windowsContainer = document.getElementById("windows-container");
const taskbarIconsContainer = document.getElementById(
	"taskbar-icons-container"
);
const taskbarClockHours = document.getElementById("taskbar-clock-hours");
const taskbarClockMinutes = document.getElementById("taskbar-clock-minutes");
const taskbarClockSeconds = document.getElementById("taskbar-clock-seconds");
/** @type {HTMLTemplateElement} */
const windowFrameTemplate = document.getElementById("window-frame-template");
/** @type {HTMLTemplateElement} */
const taskbarIconTemplate = document.getElementById("taskbar-icon-template");

class WindowFrame {
	static borderWidth = 10;

	/** @param {App} app  */
	constructor(app) {
		/** @type {DocumentFragment} */
		const documentFragment = windowFrameTemplate.content.cloneNode(true);

		/** @type {HTMLElement} */
		const icon = documentFragment.querySelector(".window-icon");

		icon.innerText = app.icon_id;

		const name = documentFragment.querySelector(".window-name");

		name.innerText = app.name;

		/** @type {HTMLIFrameElement} */
		const content = documentFragment.querySelector(".window-content");

		content.src = `/windows/${app.id}.html`;
		content.addEventListener("load", () => {
			content.contentDocument.title = app.name;
		});

		/** @type {HTMLButtonElement} */
		const closeButton = documentFragment.querySelector(
			".window-close-button"
		);

		// hack-ish solution to prevent dragging the window when close button is clicked
		closeButton.addEventListener("mousedown", (event) =>
			event.stopPropagation()
		);

		/** @type {HTMLElement} */
		const border = documentFragment.querySelector(".window-border");

		border.addEventListener("mouseenter", (event) => {
			this.showResizeOutline(true);
		});
		border.addEventListener("mouseleave", (event) => {
			if (this.resizeSide) {
				return;
			}

			this.showResizeOutline(false);
		});

		/** @type {Vector2} */
		this.grabOffset = null;
		/** @type {number} */
		this.resizeSide = null;
		this.documentFragment = documentFragment;
		/** @type {HTMLElement} */
		this.frame = documentFragment.querySelector(".window-frame");
		/** @type {HTMLElement} */
		this.titlebar = documentFragment.querySelector(".window-titlebar");
		this.icon = icon;
		this.name = name;
		/** @type {HTMLElement} */
		this.contentBarrier = documentFragment.querySelector(
			".window-content-barrier"
		);
		this.content = content;
		this.closeButton = closeButton;
		this.border = border;

		this.enableContentInteraction(true);
	}

	/** @param {boolean} enable */
	enableContentInteraction(enable) {
		this.contentBarrier.style.display = enable ? "none" : "inherit";
	}

	/** @param {boolean} show */
	showResizeOutline(show) {
		this.frame.style.boxShadow = show
			? "0px 0px 5px 2px var(--accent-color)"
			: null;
	}

	/**
	 * @param {Vector2} cursorPosition
	 */
	startDrag(cursorPosition) {
		this.grabOffset = cursorPosition;
		this.enableContentInteraction(false);
	}

	stopDrag() {
		this.grabOffset = null;
		this.enableContentInteraction(true);
	}

	/**
	 * @param {Vector2} cursorPosition
	 */
	startResize(cursorPosition) {
		if (cursorPosition.y <= WindowFrame.borderWidth) {
			this.resizeSide = 0;
		}
		if (
			cursorPosition.x >=
			this.border.clientWidth - WindowFrame.borderWidth
		) {
			this.resizeSide = 1;
		}
		if (
			cursorPosition.y >=
			this.border.clientHeight - WindowFrame.borderWidth
		) {
			this.resizeSide = 2;
		}
		if (cursorPosition.x <= WindowFrame.borderWidth) {
			this.resizeSide = 3;
		}

		this.enableContentInteraction(false);
		this.showResizeOutline(true);
	}

	stopResize() {
		this.resizeSide = null;

		this.enableContentInteraction(true);
		this.showResizeOutline(false);
	}
}

class TaskbarIcon {
	/** @param {App} app */
	constructor(app) {
		/** @type {DocumentFragment} */
		const documentFragment = taskbarIconTemplate.content.cloneNode(true);

		/** @type {HTMLElement} */
		const icon = documentFragment.querySelector(".taskbar-icon");

		icon.innerText = app.icon_id;

		this.documentFragment = documentFragment;
		this.container = documentFragment.querySelector(
			".taskbar-icon-container"
		);
		this.icon = icon;
	}
}

/**
 * @typedef {Object} App
 * @property {string} id
 * @property {string} name
 * @property {string} icon_id
 */

/** @type {Array<App>} */
const apps = [
	{
		id: "settings",
		name: "Settings",
		icon_id: "settings",
	},
	{
		id: "task_manager",
		name: "Task Manager",
		icon_id: "browse_activity",
	},
];

/**
 * @typedef {Object} Task
 * @property {WindowFrame} window
 * @property {TaskbarIcon} icon
 * @property {App} app
 */

/** @type {Array<Task>} */
this.tasks = [];

/** @type {WindowFrame} */
let draggedWindow = null;
/** @type {WindowFrame} */
let resizedWindow = null;

/** @param {App} app  */
function runApp(app) {
	const windowFrame = new WindowFrame(app);
	const taskbarIcon = new TaskbarIcon(app);

	windowsContainer.appendChild(windowFrame.documentFragment);
	taskbarIconsContainer.appendChild(taskbarIcon.documentFragment);

	windowFrame.titlebar.addEventListener("mousedown", (event) => {
		draggedWindow = windowFrame;
		draggedWindow.startDrag({ x: event.offsetX, y: event.offsetY });

		toggleStartMenu(false);
	});

	windowFrame.border.addEventListener("mousedown", (event) => {
		resizedWindow = windowFrame;
		resizedWindow.startResize({ x: event.offsetX, y: event.offsetY });

		setGlobalCursor(
			`${resizedWindow.resizeSide % 2 == 0 ? "ns" : "ew"}-resize`
		);
		toggleStartMenu(false);
	});

	/** @type {Task} */
	const task = {
		window: windowFrame,
		icon: taskbarIcon,
		app: app,
	};

	const index = tasks.push(task) - 1;

	windowFrame.content.addEventListener("load", (event) => {
		windowFrame.content.contentWindow.postMessage({
			action: "set-index",
			index: index,
		});
	});

	windowFrame.closeButton.addEventListener("click", (event) =>
		stopApp(index)
	);

	dispatchEvent(new CustomEvent("app-run", { detail: task }));
}

/** @param {number} index */
function stopApp(index) {
	const task = tasks.splice(index, 1)[0];

	windowsContainer.removeChild(task.window.frame);
	taskbarIconsContainer.removeChild(task.icon.container);

	dispatchEvent(new CustomEvent("app-stopped", { detail: index }));
}

/** @param {string} cursor */
function setGlobalCursor(cursor) {
	document.body.style.cursor = cursor;
}

/** @param {boolean} force */
function toggleStartMenu(force) {
	startMenu.classList.toggle("open", force);
}

addEventListener("mousemove", (event) => {
	/** @type {Vector2} */
	const mousePosition = {
		x: Math.max(event.clientX, 0),
		y: Math.max(event.clientY, 0),
	};

	if (draggedWindow) {
		const frame = draggedWindow.frame;
		const offset = draggedWindow.grabOffset;

		frame.style.left = `${clamp(
			mousePosition.x - offset.x,
			0,
			desktop.clientWidth - frame.clientWidth
		)}px`;
		frame.style.top = `${clamp(
			mousePosition.y - offset.y,
			0,
			desktop.clientHeight - frame.clientHeight
		)}px`;
	}

	if (resizedWindow) {
		const frame = resizedWindow.frame;

		switch (resizedWindow.resizeSide) {
			case 0: {
				const height = frame.clientHeight;

				frame.style.height = `${
					height + (frame.offsetTop - mousePosition.y)
				}px`;

				frame.style.top = `${clamp(
					mousePosition.y,
					0,
					frame.offsetTop + height - 300
				)}px`;

				break;
			}
			case 1: {
				frame.style.width = `${clamp(
					mousePosition.x - frame.offsetLeft,
					0,
					desktop.clientWidth - frame.offsetLeft - 3
				)}px`;

				break;
			}
			case 2: {
				frame.style.height = `${clamp(
					mousePosition.y - frame.offsetTop,
					0,
					desktop.clientHeight - frame.offsetTop - 3
				)}px`;

				break;
			}
			case 3: {
				const width = frame.clientWidth;

				frame.style.width = `${
					width + (frame.offsetLeft - mousePosition.x)
				}px`;

				frame.style.left = `${clamp(
					mousePosition.x,
					0,
					frame.offsetLeft + width - 400
				)}px`;

				break;
			}
		}
	}
});

addEventListener("mouseup", () => {
	if (draggedWindow) {
		draggedWindow.stopDrag();
		draggedWindow = null;
	}
	if (resizedWindow) {
		resizedWindow.stopResize();
		resizedWindow = null;

		setGlobalCursor(null);
	}
});

startButton.addEventListener("click", (event) => toggleStartMenu());

(function () {
	const body = startMenuApps.createTBody();

	const rowCount = Math.floor(apps.length / 2);

	for (let row = 0; row < rowCount; row++) {
		const bodyRow = body.insertRow();

		addApp(row, 0);

		if (row + 1 < apps.length) {
			addApp(row, 1);
		}

		/**
		 * @param {number} row
		 * @param {number} index
		 */
		function addApp(row, index) {
			const app = apps[row + index];

			const appCell = bodyRow.insertCell();

			appCell.innerHTML = `<span class="material-symbols-outlined">${app.icon_id}</span><span>${app.name}</span>`;
			appCell.addEventListener("click", (event) => {
				runApp(app);
				toggleStartMenu();
			});
		}
	}
})();

(function updateClock() {
	const padNumber = (number) => String(number).padStart(2, "0");

	const date = new Date();

	taskbarClockHours.innerText = padNumber(date.getHours());
	taskbarClockMinutes.innerText = padNumber(date.getMinutes());
	taskbarClockSeconds.innerText = padNumber(date.getSeconds());

	setTimeout(updateClock, 1000);
})();

setupMessageHandler(window, [
	{
		action: "kill-app",
		handler: (data) => {
			stopApp(data.index);
		},
	},
]);
