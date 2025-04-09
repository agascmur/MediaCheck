import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import { MediaListScreen } from './src/screens/MediaListScreen';
import { MediaDetailScreen } from './src/screens/MediaDetailScreen';
import { AddMediaScreen } from './src/screens/AddMediaScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MediaList" 
          component={MediaListScreen}
          options={{ title: 'My Media' }}
        />
        <Stack.Screen 
          name="MediaDetail" 
          component={MediaDetailScreen}
          options={{ title: 'Media Details' }}
        />
        <Stack.Screen 
          name="AddMedia" 
          component={AddMediaScreen}
          options={{ title: 'Add New Media' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
