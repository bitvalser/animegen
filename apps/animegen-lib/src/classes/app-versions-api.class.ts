import axios from 'axios';

export class AppVersionsApi {
  private static BASE_URL = 'https://firestore.googleapis.com/v1/projects/animegen/databases/(default)/documents';
  private static instance: AppVersionsApi;

  public static getInstance(): AppVersionsApi {
    if (AppVersionsApi.instance) {
      return AppVersionsApi.instance;
    }
    return (AppVersionsApi.instance = new AppVersionsApi());
  }

  public getLatestVersion(): Promise<{ version: string; url: string }> {
    return axios
      .get<any>(`${AppVersionsApi.BASE_URL}/versions/latest`)
      .then((response) => response.data)
      .then((data) => ({
        version: data.fields.version.stringValue,
        url: data.fields.url.stringValue,
      }));
  }
}
