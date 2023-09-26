export abstract class DriveUploaderBase {
  public abstract uploadFile(file: string): Promise<string>;
}
