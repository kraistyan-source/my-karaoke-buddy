const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Hardware acceleration
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    fullscreenable: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../public/icons/icon-512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the built app
  const indexPath = path.join(__dirname, "../dist/index.html");
  mainWindow.loadFile(indexPath);

  // F11 fullscreen toggle
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F11") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC: open folder picker
ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

// IPC: open file picker
ipcMain.handle("dialog:openFiles", async (_event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: filters || [
      { name: "Media", extensions: ["mp4", "mp3", "mkv"] },
    ],
  });
  return result.canceled ? [] : result.filePaths;
});

// IPC: read directory contents
ipcMain.handle("fs:readDir", async (_event, dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: path.join(dirPath, e.name),
    }));
  } catch {
    return [];
  }
});

// IPC: check if file exists
ipcMain.handle("fs:exists", async (_event, filePath) => {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
