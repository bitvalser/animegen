export interface CoubSearchApi {
  page: number;
  per_page: number;
  coubs: {
    file_versions: {
      share: {
        default: string;
      };
    };
  }[];
}
