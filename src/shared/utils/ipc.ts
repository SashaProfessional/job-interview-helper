import { IPCChannels } from '../enums/ipcChannels';

export const sendToIPC = (channel: IPCChannels, ...args: unknown[]) =>
  window.electron?.ipcRenderer.sendMessage(
    channel as unknown as keyof typeof IPCChannels,
    ...args,
  );

export const subscribeOnIPC = (channel: IPCChannels, handler: any) =>
  window.electron?.ipcRenderer.on(
    channel as unknown as keyof typeof IPCChannels,
    handler,
  );
