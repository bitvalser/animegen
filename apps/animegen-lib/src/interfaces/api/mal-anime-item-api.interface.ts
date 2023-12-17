export interface MalAnimeItemApi {
  node: {
    id: number;
    title: string;
  };
  list_status: {
    status: string;
    score: number;
    num_episodes_watched: number;
    is_rewatching: boolean;
    updated_at: string;
  };
}
