import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { MediaWithUserData, MediaState, UserMedia } from '../types';
import { getUserMediaFromAPI, deleteUserMediaFromAPI } from '../services/api';
import { getMediaWithUserData } from '../services/database';
import { syncData, pushLocalChanges } from '../services/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MediaListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaList'>;
type MediaListScreenRouteProp = RouteProp<RootStackParamList, 'MediaList'>;

type Props = {
  navigation: MediaListScreenNavigationProp;
  route: MediaListScreenRouteProp;
};

export const MediaListScreen: React.FC<Props> = ({ navigation, route }) => {
  const [media, setMedia] = useState<MediaWithUserData[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaWithUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<MediaState | undefined>(undefined);

  const loadMedia = async () => {
    try {
      setLoading(true);
      
      // First try to sync with API
      await syncData();
      
      // Then get data from local database
      const localData = await getMediaWithUserData();
      
      if (localData.length > 0) {
        setMedia(localData);
        applyFilter(localData, selectedState);
      } else {
        // Fallback to API if no local data
        const userMediaData = await getUserMediaFromAPI();
        const transformedData = userMediaData.map((userMedia: UserMedia) => ({
          ...userMedia.media!,
          userState: userMedia.state !== undefined ? Number(userMedia.state) : undefined,
          userScore: userMedia.score !== undefined ? Number(userMedia.score) : undefined
        }));
        
        setMedia(transformedData);
        applyFilter(transformedData, selectedState);
      }
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

  const applyFilter = (data: MediaWithUserData[], state?: MediaState) => {
    if (state === undefined) {
      // Show all items regardless of their state
      setFilteredMedia(data);
      return;
    }
    
    const stateNum = Number(state);
    const filtered = data.filter(item => {
      // For other states, show items that match the state
      return item.userState === stateNum;
    });
    
    setFilteredMedia(filtered);
  };

  const handleDeleteMedia = async (mediaId: number) => {
    try {
      // Get user media from API
      const userMediaList = await getUserMediaFromAPI();
      const userMedia = userMediaList.find(um => um.media?.id === mediaId);
      
      if (userMedia && userMedia.id !== undefined) {
        // Delete from API
        await deleteUserMediaFromAPI(userMedia.id);
        
        // Push changes to sync local database
        await pushLocalChanges();
        
        // Update local state
        const updatedMedia = media.filter(m => m.id !== mediaId);
        setMedia(updatedMedia);
        applyFilter(updatedMedia, selectedState);
      }
    } catch (error: any) {
      console.error('Error deleting media:', error);
      Alert.alert('Error', 'Failed to delete media. Please try again.');
    }
  };

  const showDeleteConfirmation = (mediaId: number, title: string) => {
    Alert.alert(
      'Delete Media',
      `Are you sure you want to delete "${title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteMedia(mediaId)
        }
      ]
    );
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

  // Apply filter when selectedState changes
  useEffect(() => {
    applyFilter(media, selectedState);
  }, [selectedState, media]);

  const renderMediaItem = ({ item }: { item: MediaWithUserData }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => navigation.navigate('MediaDetail', { mediaId: item.id!.toString() })}
      onLongPress={() => showDeleteConfirmation(item.id!, item.title)}
      delayLongPress={500}
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

  const renderFilterBar = () => (
    <View style={styles.filterBarContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {Object.values(MediaState)
          .filter(v => !isNaN(Number(v)))
          .map(state => {
            const stateValue = Number(state);
            const stateColor = {
              [MediaState.CHECK]: '#2196F3',    // Blue
              [MediaState.CHECKED]: '#4CAF50',  // Green
              [MediaState.VIEWING]: '#FFC107',  // Amber
              [MediaState.DONE]: '#9C27B0',     // Purple
            }[stateValue] || '#e0e0e0';         // Default gray

            return (
              <TouchableOpacity
                key={state}
                style={[
                  styles.filterButton,
                  selectedState === stateValue && styles.selectedFilterButton,
                  { borderColor: stateColor }
                ]}
                onPress={() => {
                  // Toggle the filter - if already selected, clear it
                  setSelectedState(selectedState === stateValue ? undefined : stateValue);
                }}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedState === stateValue && styles.selectedFilterButtonText
                ]}>
                  {MediaState[stateValue]}
                </Text>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderFilterBar()}
      <FlatList
        data={filteredMedia}
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
  filterBarContainer: {
    height: 52,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterBar: {
    flex: 1,
  },
  filterBarContent: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
    height: 52,
    paddingVertical: 8,
  },
  filterButton: {
    minWidth: 80,
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFilterButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedFilterButtonText: {
    color: 'white',
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