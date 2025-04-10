import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { MediaWithUserData, MediaState, UserMedia } from '../types';
import { getUserMediaFromAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MediaListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaList'>;
type MediaListScreenRouteProp = RouteProp<RootStackParamList, 'MediaList'>;

type Props = {
  navigation: MediaListScreenNavigationProp;
  route: MediaListScreenRouteProp;
};

export const MediaListScreen: React.FC<Props> = ({ navigation, route }) => {
  const [media, setMedia] = useState<MediaWithUserData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedia = async () => {
    try {
      setLoading(true);
      
      // Fetch data from API
      const userMediaData = await getUserMediaFromAPI();
      const transformedData = userMediaData.map((userMedia: UserMedia) => ({
        ...userMedia.media!,
        userState: userMedia.state,
        userScore: userMedia.score
      }));
      
      setMedia(transformedData);
    } catch (error: any) {
      console.error('Error loading media:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMedia();
    }, [])
  );

  // Refresh when route params change
  useEffect(() => {
    if (route.params?.refresh) {
      loadMedia();
    }
  }, [route.params?.refresh]);

  const renderMediaItem = ({ item }: { item: MediaWithUserData }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => navigation.navigate('MediaDetail', { mediaId: item.id!.toString() })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.type}>{item.media_type}</Text>
      {item.userState !== undefined && (
        <Text style={styles.state}>
          State: {MediaState[item.userState]}
        </Text>
      )}
      {item.userScore !== undefined && (
        <Text style={styles.score}>Score: {item.userScore}/10</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={media}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id?.toString() || ''}
        refreshing={loading}
        onRefresh={loadMedia}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddMedia')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mediaItem: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  state: {
    fontSize: 14,
    color: '#2196F3',
  },
  score: {
    fontSize: 14,
    color: '#4CAF50',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
  },
}); 