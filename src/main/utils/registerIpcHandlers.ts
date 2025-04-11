import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';

import { IPCChannels } from '../../shared/enums/ipcChannels';
import TcpClient from '../tcp/client';
import captureFullScreen from './captureFullScreen';
import { TCPDataType } from '../../shared/enums/tcpDataType';

export default function registerIpcHandlers(
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
    IPCChannels.RM_SEND_TCP_MESSAGE,
    (_event: IpcMainEvent, payload: any) =>
      tcpClient.sendMessage(payload, TCPDataType.text),
  );

  ipcMain.on(
    IPCChannels.RM_SEND_TCP_SCREENSHOT,
    async (_event: IpcMainEvent) => {
      if (!mainWindow) return;
      const startTime = performance.now();

      mainWindow.once('hide', async () => {
        const windowHiddenTime = performance.now();
        const screenshotBuffer = await captureFullScreen();
        const screenshotEndTime = performance.now();

        tcpClient.sendMessage(screenshotBuffer, TCPDataType.image, false);

        mainWindow.show();
        const windowShowTime = performance.now();

        console.log(`
      🕒 Скриншотный замер:
      - ⏳ До скрытия окна: ${(windowHiddenTime - startTime).toFixed(2)} ms
      - 📸 Снятие скрина: ${(screenshotEndTime - windowHiddenTime).toFixed(2)} ms
      - 🪟 Показ окна после скрина: ${(windowShowTime - screenshotEndTime).toFixed(2)} ms
      - ⏱️ Общая продолжительность: ${(windowShowTime - startTime).toFixed(2)} ms
          `);
      });

      mainWindow.hide();
    },
  );
}
