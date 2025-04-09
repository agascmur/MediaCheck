import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { MediaWithUserData, MediaState } from '../types';
import { getMediaWithUserData, updateUserMedia } from '../services/database';
import { pushLocalChanges } from '../services/sync';

type MediaDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaDetail'>;
type MediaDetailScreenRouteProp = RouteProp<RootStackParamList, 'MediaDetail'>;

interface Props {
  navigation: MediaDetailScreenNavigationProp;
  route: MediaDetailScreenRouteProp;
}

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
      const mediaList = await getMediaWithUserData();
      const foundMedia = mediaList.find(m => m.id === Number(mediaId));
      setMedia(foundMedia || null);
    } catch (error) {
      console.error('Error loading media details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (newState: MediaState) => {
    if (!media) return;

    try {
      await updateUserMedia({
        media_id: media.id!,
        state: newState,
        score: media.userScore,
      });
      setMedia({ ...media, userState: newState });
      await pushLocalChanges();
    } catch (error) {
      console.error('Error updating media state:', error);
    }
  };

  const handleScoreChange = async (newScore: number) => {
    if (!media) return;

    try {
      await updateUserMedia({
        media_id: media.id!,
        state: media.userState || MediaState.CHECK,
        score: newScore,
      });
      setMedia({ ...media, userScore: newScore });
      await pushLocalChanges();
    } catch (error) {
      console.error('Error updating media score:', error);
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
            .map(state => (
              <TouchableOpacity
                key={state}
                style={[
                  styles.stateButton,
                  media.userState === Number(state) && styles.selectedStateButton,
                ]}
                onPress={() => handleStateChange(Number(state))}
              >
                <Text style={[
                  styles.stateButtonText,
                  media.userState === Number(state) && styles.selectedStateButtonText,
                ]}>
                  {MediaState[Number(state)]}
                </Text>
              </TouchableOpacity>
            ))}
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