import { desktopCapturer, screen } from 'electron';

export default async function captureFullScreen() {
  const { width, height } = screen.getPrimaryDisplay().size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height },
  });

  const screenSource = sources[0];
  const imageBuffer = screenSource.thumbnail.toPNG();
  return imageBuffer; // 👈 отдаём Buffer, не Base64
}
