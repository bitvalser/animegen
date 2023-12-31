export interface AnimeThemesItemApi {
  id: number;
  animethemes: {
    type: string;
    animethemeentries: {
      videos: {
        link: string;
      }[];
    }[];
  }[];
}
