import net from 'net';

import { getTextBlockMock } from '../../mocks/TextBlocks';
import { TCP_CONFIG } from './config';

export const startBackendMockServer = () => {
  const server = net.createServer((socket) => {
    console.log('🟢 Client connected to mock Backend TCP server');

    socket.on('data', (data) => {
      console.log('📩 Backend received from Electron:', data.toString());

      
      const response = JSON.stringify(getTextBlockMock(1)) + '\n';
      socket.write(response);
    });

    socket.on('end', () => {
      console.log('🔴 Client disconnected');
    });
  });

  server.listen(TCP_CONFIG.PORT, TCP_CONFIG.HOST, () => {
    console.log('🚀 Mock Backend TCP Server is running');
  });
};
