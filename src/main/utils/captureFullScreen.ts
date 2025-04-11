import { desktopCapturer, screen } from 'electron';
import fs from 'fs';
import path from 'path';

export default async function captureFullScreen() {
  const { width, height } = screen.getPrimaryDisplay().size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height },
  });

  const screenSource = sources[0];
  const imageBuffer = screenSource.thumbnail.toPNG(); // PNG сжатый формат

  // Укажем путь для сохранения
  const savePath = path.join(__dirname, 'screenshot.png');

  // Сохраняем на диск
  fs.writeFile(savePath, imageBuffer, (err) => {
    if (err) {
      console.error('❌ Ошибка при сохранении скриншота:', err);
    } else {
      console.log('✅ Скриншот успешно сохранён по пути:', savePath);
    }
  });

  return imageBuffer; // Можно вернуть, если дальше надо использовать
}
