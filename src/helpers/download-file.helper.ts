import axios from 'axios';
import { createWriteStream } from 'fs';

export async function downloadFile(fileUrl: string, outputLocationPath: string): Promise<void> {
  const writer = createWriteStream(outputLocationPath);

  return axios
    .get(fileUrl, {
      responseType: 'stream',
    })
    .then((response: any) => {
      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error: any = null;
        writer.on('error', (err) => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) {
            resolve();
          }
        });
      });
    });
}
