import path from 'path';
import { app, BrowserWindow, shell, globalShortcut } from 'electron';

import { startBackendMockServer } from './tcp/backend-mock';
import TcpClient from './tcp/client';
import registerIpcHandlers from './utils/registerIpcHandlers';
import { resolveHtmlPath } from './utils/resolveHtmlPath';

const useDevTools = false; // Sasha's пиздюк

let mainWindow: BrowserWindow | null = null;
const tcpClient = new TcpClient();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    fullscreen: true,
    transparent: true,
    frame: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      devTools: useDevTools,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  try {
    mainWindow.setContentProtection(false);
  } catch (error) {
    console.error('Failed to set content protection:', error);
  }

  try {
    mainWindow.setIgnoreMouseEvents(useDevTools ? false : true, {
      forward: true,
    });
  } catch (error) {
    console.error('Failed to set ignore mouse events:', error);
  }

  try {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  } catch (error) {
    console.error('Failed to set window always on top:', error);
  }

  try {
    mainWindow.loadURL(resolveHtmlPath('index.html'));
  } catch (error) {
    console.error('Failed to load URL:', error);
    app.quit();
  }

  registerIpcHandlers(mainWindow, tcpClient, useDevTools);

  try {
    globalShortcut.register('CmdOrCtrl+Q', () => mainWindow?.close()) ??
      console.log('The shortcut could not be registered.');
  } catch (error) {
    console.error('Error registering shortcut:', error);
  }

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    try {
      shell.openExternal(edata.url);
    } catch (error) {
      console.error('Failed to open external URL:', error);
    }
    return { action: 'deny' };
  });

  if (mainWindow) {
    tcpClient.setMainWindow(mainWindow);
  }
};

app.once('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.once('will-quit', () => {
  globalShortcut.unregisterAll();
  tcpClient.destroy();
});

app
  .whenReady()
  .then(() => {
    createWindow();

    setTimeout(() => startBackendMockServer(), 1500);

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow(); // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
      }
    });
  })
  .catch(console.log);
