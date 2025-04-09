// src/main/tcpClient.ts
import net from 'net';
import { BrowserWindow, ipcMain } from 'electron';

import { IPCChannels } from '../../shared/enums/ipcChannels';
import { TCP_CONFIG } from './config';

let client: net.Socket | null = null;
let mainWindow: BrowserWindow | null = null;
let buffer = '';

export const setMainWindowForTcp = (window: BrowserWindow) => {
  mainWindow = window;
};

export const startTcpClient = () => {
  client = new net.Socket();

  client.connect(TCP_CONFIG.PORT, TCP_CONFIG.HOST, () => {
    console.log('🟢 Connected to TCP server');
  });

  client.on('data', (data) => {
    buffer += data.toString();
    const parts = buffer.split('\n');

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        const parsed = JSON.parse(parts[i]);

        if (!mainWindow) {
            console.warn('⚠️ mainWindow is not available');
          return;
        }
        console.log('📩 Sending parced TCP message to Renderer:', parsed);

        mainWindow.webContents.send(IPCChannels.MR_TEXT_BLOCK_RECEIVED, parsed);
      } catch (e) {
        console.error('❌ JSON Parse Error:', e);
      }
    }

    buffer = parts[parts.length - 1]; // Последняя строка — возможно неполная
  });

  client.on('error', (err) => {
    console.error('TCP Client Error:', err.message);
  });

  client.on('close', () => {
    console.warn('TCP connection closed');
    // Автоматический reconnect можно реализовать тут
  });

  // Получаем сообщения от фронта
  ipcMain.on(IPCChannels.RM_SEND_TCP_MESSAGE, (_event, payload: any) => {
    if (client && !client.destroyed) {
      console.log('📩 Sending to TCP server:', payload);
      client.write(JSON.stringify(payload) + '\n');
    }
  });
};
