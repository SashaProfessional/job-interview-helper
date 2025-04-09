import net from 'net';
import { BrowserWindow, ipcMain } from 'electron';

import { IPCChannels } from '../../shared/enums/ipcChannels';
import { TCP_CONFIG } from './config';

let client: net.Socket | null = null;
let mainWindow: BrowserWindow | null = null;
let buffer = '';
let reconnectAttempts = 0;
let isReconnecting = false;

export const setMainWindowForTcp = (window: BrowserWindow) => {
  mainWindow = window;
};

const connectTcpClient = () => {
  if (isReconnecting) {
    console.log('⚠️ Already attempting to reconnect, skipping this attempt...');
    return;
  }

  console.log('🔌 Attempting to connect to TCP server...', reconnectAttempts);

  if (client) {
    if (!client.destroyed) {
      console.log('🔴 Destroying existing TCP client before creating a new one...');
      client.destroy();  // Разрушаем сокет, если он существует и не был разрушен
    } else {
      console.log('🔴 Client already destroyed');
    }
  }

  
  if (client) {
    client.removeAllListeners('data');
    client.removeAllListeners('error');
    client.removeAllListeners('close');
    client.destroy()
  }
  console.log('➕ Creating new TCP client...');
  client = new net.Socket();  // Создаем новый сокет

  client.connect(TCP_CONFIG.PORT, TCP_CONFIG.HOST, () => {
    console.log('🟢 Connected to TCP server', reconnectAttempts);
    reconnectAttempts = 0;
    isReconnecting = false;
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

        mainWindow.webContents.send(IPCChannels.MR_TEXT_BLOCK_RECEIVED, parsed);
      } catch (e) {
        console.error('❌ JSON Parse Error:', e);
      }
    }

    buffer = parts[parts.length - 1]; // Последняя строка — возможно неполная
  });

  client.on('error', (err) => {
    console.error('Error TCP Client:', err.message);
    handleReconnection();
  });

  client.on('close', () => {
    console.warn('Closed TCP connection');
    handleReconnection();
  });

  const handleReconnection = () => {
    if (isReconnecting) {
      return;
    }

    if (reconnectAttempts < TCP_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      isReconnecting = true;

      setTimeout(() => {
        isReconnecting = false;
        connectTcpClient();
      }, TCP_CONFIG.RECONNECT_DELAY);
    } else {
      console.error('❌ Max reconnect attempts reached. Giving up.');
      isReconnecting = false;
    }
  };
};

export const startTcpClient = () => {
  console.log('startTcpClient');

  ipcMain.on(IPCChannels.RM_SEND_TCP_MESSAGE, (_event, payload: any) => {
    if (client && !client.destroyed && client.readyState === 'open') {
      console.log('📩 Sending to TCP server:', payload);
      client.write(JSON.stringify(payload) + '\n');
    } else {
      console.warn('⚠️ TCP client is not connected.');
    }
  });

  connectTcpClient(); 
};
