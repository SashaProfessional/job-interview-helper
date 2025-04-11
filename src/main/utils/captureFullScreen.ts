import { desktopCapturer, screen } from 'electron';

export default async function captureFullScreen() {
  const { width, height } = screen.getPrimaryDisplay().size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height },
  });

  return sources[0].thumbnail.toPNG();
}
