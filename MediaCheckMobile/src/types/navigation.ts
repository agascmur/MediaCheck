import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MediaList: { refresh?: boolean };
  MediaDetail: { mediaId: string };
  AddMedia: undefined;
}; 