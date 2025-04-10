import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MediaWithUserData, MediaState } from '../types';
import { getMediaWithUserData } from '../services/database';
import { syncData, pushLocalChanges } from '../services/sync';

type MediaListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaList'>;

interface Props {
  navigation: MediaListScreenNavigationProp;
  route: any;
}

export const MediaListScreen: React.FC<Props> = ({ navigation, route }) => {
  const [media, setMedia] = useState<MediaWithUserData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const mediaData = await getMediaWithUserData();
      setMedia(mediaData);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

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