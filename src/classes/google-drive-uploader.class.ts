import fs from 'fs';
import { DriveUploaderBase } from './drive-uploader-base.class';
import * as google from '@googleapis/drive';

export class GoogleDriveUploader extends DriveUploaderBase {
  private drive: google.drive_v3.Drive;
  private drivePath: string;

  public constructor(credentialsPath: string, drivePath: string) {
    super();
    this.drivePath = drivePath;
    this.drive = new google.drive_v3.Drive({
      auth: new google.auth.GoogleAuth({
        keyFilename: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
      }),
    });
  }

  public uploadFile(file: string): Promise<string> {
    const fileName = file.split('/').reverse()[0];
    return this.drive.files
      .create({
        requestBody: {
          parents: [this.drivePath],
          name: fileName,
        },
        media: {
          mimeType: 'application/zip',
          body: fs.createReadStream(file),
        },
        fields: 'id,webViewLink',
      })
      .then((response) =>
        this.drive.permissions
          .create({
            fileId: response.data.id,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
          })
          .then(() => response.data.webViewLink),
      );
  }
}
