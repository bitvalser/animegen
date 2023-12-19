import { Channels } from '../../main/preload';

const GET_TIMEOUT = 15000;

export const getFromElectron = <T = any>(channel: Channels) =>
  new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject();
    }, GET_TIMEOUT);
    window.electron.ipcRenderer.once(channel, (data: any) => {
      clearTimeout(timeout);
      resolve(data);
    });
    window.electron.ipcRenderer.sendMessage(channel);
  });
