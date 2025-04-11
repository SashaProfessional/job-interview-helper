import net from 'net';
import fs from 'fs';
import path from 'path';
import { getTextBlockMock } from '../../mocks/TextBlocks';
import { ChunkHeaderType } from '../../shared/types/ChunkHeaderType';
import { TCP_CONFIG } from './config';

type ChunkStorage = {
  chunks: Buffer[];
  received: number;
  total: number;
};

const fileBuffersMap = new Map<number, ChunkStorage>();
let buffer = Buffer.alloc(0); // Буфер для накопления данных

export const startBackendMockServer = () => {
  const server = net.createServer((socket) => {
    console.log('📦🟢 Client connected to mock Backend TCP server');

    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);

      while (buffer.length >= TCP_CONFIG.HEADER_CHUNK_SIZE) {
        const headerRaw = buffer
          .slice(0, TCP_CONFIG.HEADER_CHUNK_SIZE)
          .toString();
        let headerObj: ChunkHeaderType;

        try {
          headerObj = JSON.parse(headerRaw.trim());
        } catch (e: any) {
          console.error(
            `📦❌ Failed to parse header: ${e?.message}, skipping 1 byte`,
          );
          buffer = buffer.slice(1); // Сдвигаем буфер, если заголовок невалиден
          continue;
        }

        const packetSize = TCP_CONFIG.HEADER_CHUNK_SIZE + headerObj.length;
        if (buffer.length < packetSize) {
          break;
        }

        const { id, index, total } = headerObj;
        const body = buffer.slice(TCP_CONFIG.HEADER_CHUNK_SIZE, packetSize);
        buffer = buffer.slice(packetSize);

        console.log(`📦 Received chunk ${index + 1} of ${total} for ID ${id}`);

        if (!fileBuffersMap.has(id)) {
          fileBuffersMap.set(id, {
            chunks: new Array(total),
            received: 0,
            total,
          });
        }

        const storage = fileBuffersMap.get(id)!;
        storage.chunks[index] = body;
        storage.received++;

        if (storage.received === total) {
          const completeBuffer = Buffer.concat(storage.chunks);
          const filePath = path.join(__dirname, `screenshot-${id}.png`);

          fs.writeFile(filePath, completeBuffer, (err) => {
            if (err) {
              console.error('📦❌ Error saving screenshot:', err);
            } else {
              console.log('📦✅ Screenshot saved to:', filePath);
            }
          });

          fileBuffersMap.delete(id);
        }

        // Отправляем ответ клиенту
        const response = JSON.stringify(getTextBlockMock(1)) + '\n';
        socket.write(response);
      }
    });

    socket.on('end', () => {
      console.log('📦🔴 Client disconnected');
    });

    socket.on('error', (err) => {
      console.error('📦❌ Socket error:', err.message);
    });
  });

  server.listen(TCP_CONFIG.PORT, TCP_CONFIG.HOST, () => {
    console.log(
      `📦🚀 Mock Backend TCP Server is running on ${TCP_CONFIG.HOST}:${TCP_CONFIG.PORT}`,
    );
  });

  server.on('error', (err) => {
    console.error('📦❌ Server error:', err.message);
  });
};
