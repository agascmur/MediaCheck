import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MediaList: undefined;
  MediaDetail: { mediaId: number };
  AddMedia: undefined;
}; 