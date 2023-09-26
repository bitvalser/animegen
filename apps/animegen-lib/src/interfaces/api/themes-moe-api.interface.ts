export interface ThemesMoeApi {
  malID: number;
  themes: {
    themeType: string;
    themeName: string;
    mirror: {
      mirrorURL: string;
    };
  }[];
}
