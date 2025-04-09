import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';

import { IPCChannels } from '../../shared/enums/ipcChannels';
import TcpClient from '../tcp/client';

function registerIpcHandlers(
  mainWindow: BrowserWindow,
  tcpClient: TcpClient,
  useDevTools: boolean,
) {
  ipcMain.on(IPCChannels.RM_CLOSE_APP, () => mainWindow?.close());

  ipcMain.on(
    IPCChannels.RM_LOG_TO_MAIN,
    (_event: IpcMainEvent, ...args: any[]) => {
      console.log('[FRONT LOG]:', ...args);
    },
  );

  ipcMain.on(
    IPCChannels.RM_SET_IGNORE_MOUSE_EVENTS,
    (_event: IpcMainEvent, value: boolean) => {
      if (useDevTools) {
        return;
      }

      if (value) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
      } else {
        mainWindow.setIgnoreMouseEvents(false);
      }
    },
  );

  ipcMain.on(
    IPCChannels.MM_TCP_TEXT_BLOCK_RECEIVED,
    (_event: IpcMainEvent, data: any) => {
      mainWindow.webContents.send(IPCChannels.MR_TEXT_BLOCK_RECEIVED, data);
    },
  );

  ipcMain.on(
    IPCChannels.RM_SEND_TCP_MESSAGE,
    (_event: IpcMainEvent, payload: any) => tcpClient.sendMessage(payload),
  );
}

export default registerIpcHandlers;
