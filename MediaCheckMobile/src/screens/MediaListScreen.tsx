import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator, ScrollView, Alert, TextInput } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { MediaWithUserData, MediaState, UserMedia } from '../types';
import { getUserMediaFromAPI, deleteUserMediaFromAPI, deleteMediaFromAPI } from '../services/api';

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadMedia = async () => {
    try {
      setLoading(true);
      
      // Fetch data from API
      const userMediaData = await getUserMediaFromAPI();
      const transformedData = userMediaData.map((userMedia: UserMedia) => ({
        ...userMedia.media!,
        userState: userMedia.state !== undefined ? Number(userMedia.state) : undefined,
        userScore: userMedia.score !== undefined ? Number(userMedia.score) : undefined
      }));
      
      setMedia(transformedData);
      applyFilter(transformedData, selectedState, searchQuery); // Apply the filter with search query
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

  const applyFilter = (data: MediaWithUserData[], state?: MediaState, searchTerm: string = '') => {
    let filtered = data;

    if (state !== undefined) {
      const stateNum = Number(state);
      filtered = filtered.filter(item => item.userState === stateNum);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMedia(filtered);
  };

  const handleDeleteMedia = async (mediaId: number) => {
    try {
      const userMediaList = await getUserMediaFromAPI();
      const userMedia = userMediaList.find(um => um.media?.id === mediaId);
      
      if (userMedia && userMedia.id !== undefined) {
        await deleteMediaFromAPI(userMedia.media?.id ?? 0);
        
        const updatedMedia = media.filter(m => m.id !== mediaId);
        setMedia(updatedMedia);
        applyFilter(updatedMedia, selectedState, searchQuery);
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

  // Apply filter when selectedState or searchQuery changes
  useEffect(() => {
    applyFilter(media, selectedState, searchQuery);
  }, [selectedState, searchQuery, media]);

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
              [MediaState.CHECK]: '#2196F3',
              [MediaState.CHECKED]: '#4CAF50',
              [MediaState.VIEWING]: '#FFC107',
              [MediaState.DONE]: '#9C27B0',
            }[stateValue] || '#e0e0e0';

            return (
              <TouchableOpacity
                key={state}
                style={[
                  styles.filterButton,
                  selectedState === stateValue && styles.selectedFilterButton,
                  { borderColor: stateColor }
                ]}
                onPress={() => {
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
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title..."
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
          }}
        />
      </View>

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
  searchBarContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingLeft: 12,
    fontSize: 16,
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
