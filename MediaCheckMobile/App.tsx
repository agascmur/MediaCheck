import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MediaListScreen } from './src/screens/MediaListScreen';
import { MediaDetailScreen } from './src/screens/MediaDetailScreen';
import { AddMediaScreen } from './src/screens/AddMediaScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MediaList">
          <Stack.Screen 
            name="MediaList" 
            component={MediaListScreen}
            options={{ title: 'My Media Collection' }}
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
    </SafeAreaProvider>
  );
}
