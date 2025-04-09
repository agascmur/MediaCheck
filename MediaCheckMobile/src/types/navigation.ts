import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  MediaList: undefined;
  MediaDetail: { mediaId: string };
  AddMedia: undefined;
}; 