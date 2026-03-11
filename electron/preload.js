const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
  openFiles: (filters) => ipcRenderer.invoke("dialog:openFiles", filters),
  readDir: (dirPath) => ipcRenderer.invoke("fs:readDir", dirPath),
  scanMediaFiles: (dirPath) => ipcRenderer.invoke("fs:scanMediaFiles", dirPath),
  fileExists: (filePath) => ipcRenderer.invoke("fs:exists", filePath),
  isElectron: true,
});
