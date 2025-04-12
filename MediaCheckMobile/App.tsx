import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { MediaListScreen } from './src/screens/MediaListScreen';
import { MediaDetailScreen } from './src/screens/MediaDetailScreen';
import { AddMediaScreen } from './src/screens/AddMediaScreen';
import { RootStackParamList } from './src/types/navigation';
import { initDatabase } from './src/services/database';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Even if initialization fails, we should still show the app
        // but log the error for debugging
        setIsInitialized(true);
      }
    };
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
