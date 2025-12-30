import {
	app,
	BaseWindow,
	BrowserWindow,
	screen,
	WebContentsView,
} from "electron";

// if (import("electron-squirrel-startup")) app.quit();

const createWindow = () => {
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width, height } = primaryDisplay.workAreaSize;

	const win = new BaseWindow({
		width,
		height,
	});
	win.autoHideMenuBar = true;

	const view = new WebContentsView();
	win.contentView.addChildView(view);
	view.webContents.loadURL("http://localhost:3000");

	function setBounds() {
		if (!win || !view) return;
		const bounds = win.getBounds();
		view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
	}

	setBounds();
	win.on("resize", () => {
		setBounds();
	});
};

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
