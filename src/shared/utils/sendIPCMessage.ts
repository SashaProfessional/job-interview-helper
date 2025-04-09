import { IPCChannels } from "../enums/ipcChannels";


export const sendIPCMessage = (channel: IPCChannels, ...args: unknown[]) =>
  window.electron.ipcRenderer.sendMessage(
    channel as unknown as keyof typeof IPCChannels,
    ...args,
  );
