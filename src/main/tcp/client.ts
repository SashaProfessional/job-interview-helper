import net from 'net';
import { BrowserWindow } from 'electron';

import { IPCChannels } from '../../shared/enums/ipcChannels';
import { TCP_CONFIG } from './config';

class TcpClient {
  private client: net.Socket | null = null;
  private mainWindow: BrowserWindow | null = null;
  private buffer: string = ''; // Буфер для накопления данных
  private reconnectAttempts: number = 0;
  private isReconnecting: boolean = false;
  private messageQueue: any[] = []; // Очередь сообщений

  constructor() {
    this.connect();
  }

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private connect() {
    if (this.isReconnecting) {
      console.log('⚠️ Уже идет попытка переподключения, пропускаем...');
      return;
    }

    console.log(
      `🔌 Пытаемся подключиться к TCP серверу (попытка ${this.reconnectAttempts + 1})...`,
    );

    // Уничтожаем старый сокет, если он существует
    if (this.client) {
      if (!this.client.destroyed) {
        console.log(
          '🔴 Уничтожаем существующий клиент перед созданием нового...',
        );
        this.client.destroy();
      }
      this.client.removeAllListeners();
    }

    this.client = new net.Socket();

    // Установка обработчиков событий
    this.client.connect(TCP_CONFIG.PORT, TCP_CONFIG.HOST, () => {
      console.log('🟢 Подключение к TCP серверу установлено');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.sendQueuedMessages(); // Отправляем накопленные сообщения
    });

    this.client.on('data', (data) => this.handleData(data));
    this.client.on('error', (err) => this.handleError(err));
    this.client.on('close', () => this.handleClose());
  }

  private handleData(data: Buffer) {
    this.buffer += data.toString();
    const parts = this.buffer.split('\n');

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        const parsedData = JSON.parse(parts[i]);
        if (this.mainWindow) {
          this.mainWindow.webContents.send(
            IPCChannels.MR_TEXT_BLOCK_RECEIVED,
            parsedData,
          );
        } else {
          console.warn('⚠️ mainWindow is not available');
        }
      } catch (e) {
        console.error('❌ JSON Parse Error:', e);
      }
    }

    this.buffer = parts[parts.length - 1]; // Сохраняем последнюю неполную часть
  }

  private handleError(err: Error) {
    console.error('❌ Ошибка TCP клиента:', err.message);
    this.handleReconnection();
  }

  private handleClose() {
    console.warn('🔴 TCP соединение закрыто');
    this.handleReconnection();
  }

  private handleReconnection() {
    if (this.isReconnecting) {
      console.error('❌ Уже переподключается');
      return;
    }

    if (
      this.isReconnecting ||
      this.reconnectAttempts >= TCP_CONFIG.MAX_RECONNECT_ATTEMPTS
    ) {
      console.error(
        '❌ Достигнуто максимальное количество попыток переподключения',
      );
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`⏳ Ожидаем ${delay} мс перед следующей попыткой...`);
    setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, delay);
  }

  public isConnected() {
    return (
      !!this.client &&
      !this.client.destroyed &&
      this.client.readyState === 'open'
    );
  }

  public sendMessage(payload: any) {
    if (
      this.client &&
      !this.client.destroyed &&
      this.client.readyState === 'open' &&
      this.client.writable
    ) {
      console.log('📩 Отправляем данные на TCP сервер:', payload);
      this.client.write(JSON.stringify(payload) + '\n');
    } else {
      console.warn('⚠️ TCP клиент не подключен, добавляем сообщение в очередь');
      this.messageQueue.push(payload);
    }
  }

  private sendQueuedMessages() {
    while (this.messageQueue.length > 0) {
      const payload = this.messageQueue.shift();
      this.sendMessage(payload);
    }
  }

  public destroy() {
    if (this.client && !this.client.destroyed) {
      this.client.destroy();
    }
    this.client = null;
    this.messageQueue = [];
  }
}

export default TcpClient;
