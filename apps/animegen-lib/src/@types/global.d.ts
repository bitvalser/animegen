export interface IProcessEnv {
  FFMPEG_PATH: string;
  [key: string]: string;
}

export interface GlobalCustom {
  _TASK_CONTEXT: any;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends IProcessEnv {}
    interface Global extends GlobalCustom {}
  }
}
