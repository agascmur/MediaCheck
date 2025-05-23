export enum MediaType {
  CINEMA = 'cinema',
  SERIES = 'series',
  MANGA = 'manga',
  MUSIC = 'music',
}

export enum MediaState {
  CHECK = 0,
  CHECKED = 1,
  VIEWING = 2,
  DONE = 3,
}

export type MediaStateType = MediaState | undefined;

export interface Media {
  id?: number;
  title: string;
  media_type: MediaType;
  url?: string;
  plot?: string;
  chapters?: string;
  quotes?: string[];
  score?: number;
  created_at?: string;
}

export interface UserMedia {
  id?: number;
  media_id: number;
  state?: MediaState;
  score?: number;
  added_at?: string;
  updated_at?: string;
  media?: Media;
}

export interface MediaWithUserData extends Media {
  userState?: MediaState;
  userScore?: number;
} 