import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MediaList: undefined;
  MediaDetail: { mediaId: string };
  AddMedia: undefined;
}; 