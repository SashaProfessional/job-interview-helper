import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import { IPCChannels } from '../shared/enums/ipcChannels';

export type Channels =  keyof typeof IPCChannels;

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    
  },
  setIgnoreMouseEvents: (ignore: boolean, options?: Electron.IgnoreMouseEventsOptions) => {
    ipcRenderer.send(IPCChannels.SET_IGNORE_MOUSE_EVENTS, ignore, options);
  },
  logToMain: (...args: any[]) => {
    ipcRenderer.send(IPCChannels.LOG_TO_MAIN, ...args);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
