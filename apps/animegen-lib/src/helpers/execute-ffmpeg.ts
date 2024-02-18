import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';

export const executeFfmpeg = (args): FfmpegCommand => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const command = ffmpeg().output(' ') as any;
  command._outputs[0].isFile = false;
  command._outputs[0].target = '';
  command._global.get = () => {
    if (typeof args === 'string') {
      return args.split(' ').filter((c) => c !== '' && c !== '\\\n');
    } else return args;
  };
  return command;
};
