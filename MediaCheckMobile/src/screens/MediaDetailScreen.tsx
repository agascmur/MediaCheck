import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Media, MediaState, UserMedia, MediaWithUserData, MediaStateType } from '../types';
import { getUserMediaFromAPI, updateUserMediaInAPI, addUserMediaToAPI } from '../services/api';
import { getMediaWithUserData } from '../services/database';
import { pushLocalChanges } from '../services/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MediaDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaDetail'>;
type MediaDetailScreenRouteProp = RouteProp<RootStackParamList, 'MediaDetail'>;

type Props = {
  navigation: MediaDetailScreenNavigationProp;
  route: MediaDetailScreenRouteProp;
};

export const MediaDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mediaId } = route.params;
  const [media, setMedia] = useState<MediaWithUserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [mediaId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      console.log('Loading media for ID:', mediaId);
      
      // First sync any local changes to the API
      console.log('Syncing local changes to API...');
      await pushLocalChanges();
      
      // Get all media with user data from local database
      const allMedia = await getMediaWithUserData();
      console.log('All media from database:', allMedia);
      
      const foundMedia = allMedia.find(m => m.id === Number(mediaId));
      console.log('Found media:', foundMedia);
      
      if (foundMedia) {
        console.log('Setting media state:', {
          id: foundMedia.id,
          userState: foundMedia.userState,
          userScore: foundMedia.userScore
        });
        setMedia(foundMedia);
      } else {
        console.log('Media not found in local database, trying API...');
        // If not found in local database, try API
        const apiUserMediaData = await getUserMediaFromAPI();
        console.log('API user media data:', apiUserMediaData);
        
        // Look for the media in the nested media object and transform it
        const apiUserMedia = apiUserMediaData.find(um => um.media?.id === Number(mediaId));
        console.log('Found API user media:', apiUserMedia);
        
        if (apiUserMedia && apiUserMedia.media) {
          const transformedMedia = {
            ...apiUserMedia.media,
            userState: apiUserMedia.state,
            userScore: apiUserMedia.score
          };
          console.log('Setting transformed media from API:', transformedMedia);
          setMedia(transformedMedia);
        } else {
          console.log('Media not found in API either');
          setMedia(null);
        }
      }
    } catch (error: any) {
      console.error('Error loading media details:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (newState: MediaState) => {
    if (!media) return;
    
    console.log('Current media state:', {
      id: media.id,
      currentState: media.userState,
      newState
    });
    
    // If clicking the current state, set to undefined to deselect
    const targetState = media.userState === newState ? undefined : newState;
    
    try {
      // Get user media from API
      const userMediaList = await getUserMediaFromAPI();
      const userMedia = userMediaList.find(um => um.media?.id === media.id);
      
      console.log('Found user media:', userMedia);
      
      if (userMedia) {
        // Update existing entry
        console.log('Updating existing user media:', {
          id: userMedia.id,
          media_id: media.id,
          state: targetState || MediaState.CHECK,
          score: userMedia.score
        });
        
        await updateUserMediaInAPI({
          id: userMedia.id,
          media_id: media.id!,
          state: targetState || MediaState.CHECK,
          score: userMedia.score,
          updated_at: new Date().toISOString()
        });
      } else if (targetState !== undefined) {
        // Create new user media entry only if we're not deselecting
        console.log('Creating new user media:', {
          media_id: media.id,
          state: targetState
        });
        
        await addUserMediaToAPI({
          media_id: media.id!,
          state: targetState,
          score: 0,
          updated_at: new Date().toISOString()
        });
      }
      
      // Update local state
      console.log('Updating local state:', {
        id: media.id,
        newState: targetState
      });
      
      setMedia({
        ...media,
        userState: targetState
      });
      
      // Reload media to ensure sync
      await loadMedia();
    } catch (error: any) {
      console.error('Error updating media state:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const handleScoreChange = async (newScore: number) => {
    if (!media) return;
    
    console.log('Current media score:', {
      id: media.id,
      currentScore: media.userScore,
      newScore
    });
    
    // If clicking the current score, set to undefined to deselect
    const targetScore = media.userScore === newScore ? undefined : newScore;
    
    try {
      // Get user media from API
      const userMediaList = await getUserMediaFromAPI();
      const userMedia = userMediaList.find(um => um.media?.id === media.id);
      
      console.log('Found user media:', userMedia);
      
      if (userMedia) {
        // Update existing entry
        console.log('Updating existing user media:', {
          id: userMedia.id,
          media_id: media.id,
          state: userMedia.state,
          score: targetScore
        });
        
        await updateUserMediaInAPI({
          id: userMedia.id,
          media_id: media.id!,
          state: userMedia.state,
          score: targetScore,
          updated_at: new Date().toISOString()
        });
      } else if (targetScore !== undefined) {
        // Create new user media entry only if we're not deselecting
        console.log('Creating new user media:', {
          media_id: media.id,
          score: targetScore
        });
        
        await addUserMediaToAPI({
          media_id: media.id!,
          state: MediaState.CHECK,
          score: targetScore,
          updated_at: new Date().toISOString()
        });
      }
      
      // Update local state
      console.log('Updating local state:', {
        id: media.id,
        newScore: targetScore
      });
      
      setMedia({
        ...media,
        userScore: targetScore
      });
      
      // Reload media to ensure sync
      await loadMedia();
    } catch (error: any) {
      console.error('Error updating media score:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!media) {
    return (
      <View style={styles.container}>
        <Text>Media not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{media.title}</Text>
        <Text style={styles.type}>{media.media_type}</Text>
      </View>

      {media.plot && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plot</Text>
          <Text style={styles.plot}>{media.plot}</Text>
        </View>
      )}

      {media.chapters && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chapters</Text>
          <Text style={styles.chapters}>{media.chapters}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.stateButtons}>
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
                    styles.stateButton,
                    { backgroundColor: media.userState === stateValue ? stateColor : '#e0e0e0' },
                  ]}
                  onPress={() => handleStateChange(stateValue)}
                >
                  <Text style={[
                    styles.stateButtonText,
                    media.userState === stateValue && styles.selectedStateButtonText,
                  ]}>
                    {MediaState[stateValue]}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score</Text>
        <View style={styles.scoreButtons}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
            <TouchableOpacity
              key={score}
              style={[
                styles.scoreButton,
                media.userScore === score && styles.selectedScoreButton,
              ]}
              onPress={() => handleScoreChange(score)}
            >
              <Text style={[
                styles.scoreButtonText,
                media.userScore === score && styles.selectedScoreButtonText,
              ]}>
                {score}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {media.quotes && media.quotes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quotes</Text>
          {media.quotes.map((quote, index) => (
            <Text key={index} style={styles.quote}>"{quote}"</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  plot: {
    fontSize: 16,
    lineHeight: 24,
  },
  chapters: {
    fontSize: 16,
  },
  stateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stateButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  selectedStateButton: {
    backgroundColor: '#2196F3',
  },
  stateButtonText: {
    color: '#333',
  },
  selectedStateButtonText: {
    color: 'white',
  },
  scoreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedScoreButton: {
    backgroundColor: '#4CAF50',
  },
  scoreButtonText: {
    color: '#333',
  },
  selectedScoreButtonText: {
    color: 'white',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#2196F3',
  },
}); 