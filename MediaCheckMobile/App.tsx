import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { MediaListScreen } from './src/screens/MediaListScreen';
import { MediaDetailScreen } from './src/screens/MediaDetailScreen';
import { AddMediaScreen } from './src/screens/AddMediaScreen';
import { RootStackParamList } from './src/types/navigation';
import { initDatabase } from './src/services/database';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    initDatabase().catch(error => {
      console.error('Error initializing database:', error);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Register' }}
        />
        <Stack.Screen 
          name="MediaList" 
          component={MediaListScreen}
          options={{ title: 'Media List' }}
        />
        <Stack.Screen 
          name="MediaDetail" 
          component={MediaDetailScreen}
          options={{ title: 'Media Details' }}
        />
        <Stack.Screen 
          name="AddMedia" 
          component={AddMediaScreen}
          options={{ title: 'Add Media' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
