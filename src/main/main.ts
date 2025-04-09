import path from 'path';
import { app, BrowserWindow, shell, ipcMain, globalShortcut } from 'electron';

import { IPCChannels } from '../shared/enums/ipcChannels';
import { resolveHtmlPath } from './util';
import {
  setMainWindowForTcp,
  startTcpClient,
} from './tcp/client';
import { startBackendMockServer } from './tcp/backend-mock';

const useDevTools = false; // Sasha's пиздюк

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

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

  mainWindow.setIgnoreMouseEvents(useDevTools ? false : true, {
    forward: true,
  });
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setContentProtection(false);
  mainWindow.loadURL(resolveHtmlPath('index.html'));

  const isRegistered = globalShortcut.register('CmdOrCtrl+Q', () => {
    //
    if (mainWindow) {
      mainWindow.close();
    }
  });

  if (!isRegistered) {
    console.log('The shortcut could not be registered.');
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

  ipcMain.on(IPCChannels.RM_CLOSE_APP, () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.on(IPCChannels.RM_LOG_TO_MAIN, (_event, ...args) => {
    console.log('[FRONT LOG]:', ...args);
  });

  ipcMain.on(
    IPCChannels.RM_SET_IGNORE_MOUSE_EVENTS,
    (_event, value: boolean) => {
      if (!mainWindow || useDevTools) {
        return;
      }

      if (value) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
      } else {
        mainWindow.setIgnoreMouseEvents(false);
      }
    },
  );

  ipcMain.on(IPCChannels.MM_TCP_TEXT_BLOCK_RECEIVED, (_event, data) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPCChannels.MR_TEXT_BLOCK_RECEIVED, data);
    }
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  setMainWindowForTcp(mainWindow);
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app
  .whenReady()
  .then(() => {
    createWindow();
    if (mainWindow) {
      setMainWindowForTcp(mainWindow);
    }

    startBackendMockServer();
    startTcpClient();

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow(); // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
        if (mainWindow) {
          setMainWindowForTcp(mainWindow);
        }
      }
    });
  })
  .catch(console.log);
