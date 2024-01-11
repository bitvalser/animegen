/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { createWriteStream } from 'fs';

const REQUEST_TIMEOUT = 60000;

export async function downloadFile(fileUrl: string, outputLocationPath: string): Promise<void> {
  const writer = createWriteStream(outputLocationPath);

  return new Promise((resolve, reject) => {
    const abort = new AbortController();
    const manualTimeout = setTimeout(() => {
      abort.abort();
      writer.destroy();
    }, REQUEST_TIMEOUT);
    axios
      .get(fileUrl, {
        responseType: 'stream',
        signal: abort.signal,
      })
      .then(
        (response: any) =>
          new Promise<void>((innerResolve) => {
            response.data.pipe(writer);
            let error: any = null;
            writer.on('error', (err) => {
              error = err;
              writer.close();
              innerResolve();
              reject(err);
            });
            writer.on('close', () => {
              innerResolve();
              if (!error) {
                resolve();
              }
            });
          }),
      )
      .catch(reject)
      .finally(() => {
        clearTimeout(manualTimeout);
      });
  });
}
