export interface IProcessEnv {
  FFMPEG_PATH: string;
  [key: string]: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends IProcessEnv {}
  }
}
