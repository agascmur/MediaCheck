import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Media, MediaType } from '../types';
import { addMedia, addUserMedia, deleteMedia } from '../services/database';
import { addMediaToAPI, addUserMediaToAPI, deleteMediaFromAPI } from '../services/api';
import { MediaState } from '../types';

type AddMediaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddMedia'>;

interface Props {
  navigation: AddMediaScreenNavigationProp;
}

export const AddMediaScreen: React.FC<Props> = ({ navigation }) => {
  const [media, setMedia] = useState<Partial<Media>>({
    title: '',
    media_type: MediaType.CINEMA,
    url: '',
    plot: '',
    chapters: '',
    quotes: [],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!media.title || !media.media_type) {
      Alert.alert('Error', 'Title and media type are required');
      return;
    }

    setLoading(true);
    let newMedia;
    try {
      // First post to API
      const mediaData = {
        title: media.title,
        media_type: media.media_type,
        url: media.url || undefined,
        plot: media.plot || undefined,
        chapters: media.chapters || undefined,
        quotes: media.quotes || []
      };
      
      newMedia = await addMediaToAPI(mediaData as Media);
      console.log('Media added to API:', newMedia);
      
      if (!newMedia.id) {
        throw new Error('Media ID not returned from API');
      }
      
      // Then add to local database using the server's ID
      await addMedia({
        ...newMedia,
        id: newMedia.id  // Ensure we're using the server's ID
      });
      console.log('Media added to local database');
      
      // Create initial user media entry
      const userMedia = {
        media_id: newMedia.id,  // Use the server's media ID
        state: MediaState.CHECK,
        score: undefined,
        updated_at: new Date().toISOString()
      };
      
      // Add to API first
      const apiUserMedia = await addUserMediaToAPI(userMedia);
      console.log('User media added to API:', apiUserMedia);
      
      // Then add to local database using the server's IDs
      if (!apiUserMedia.media?.id) {
        throw new Error('Media ID not found in API response');
      }
      await addUserMedia({
        ...apiUserMedia,
        id: apiUserMedia.id,
        media_id: apiUserMedia.media.id
      });
      console.log('User media added to local database');
      
      // Navigate back to main menu with refresh
      navigation.navigate('MediaList', { refresh: true });
    } catch (error: any) {
      console.error('Error adding media:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Only attempt cleanup if we have a valid media ID and the error is from user media creation
      if (newMedia?.id && error.response?.status === 500) {
        console.log('Attempting cleanup due to API error');
        try {
          await deleteMediaFromAPI(newMedia.id);
          console.log('Cleanup successful: Media deleted from API');
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
      }

      if (error.response?.data?.title) {
        // Handle duplicate media error
        Alert.alert(
          'Error',
          error.response.data.title,
          [{ text: 'OK' }]
        );
      } else if (error.response?.data?.media_id) {
        // Handle user media creation error
        Alert.alert(
          'Error',
          error.response.data.media_id,
          [{ text: 'OK' }]
        );
      } else if (error.response?.data?.non_field_errors) {
        // Handle other validation errors
        Alert.alert(
          'Error',
          error.response.data.non_field_errors[0],
          [{ text: 'OK' }]
        );
      } else if (error.message === 'Media not found in local database') {
        // Handle local database error
        Alert.alert(
          'Error',
          'There was a problem saving to your local database. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        // Handle other errors
        Alert.alert(
          'Error',
          'Error adding media. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={media.title}
          onChangeText={(text) => setMedia({ ...media, title: text })}
          placeholder="Enter title"
        />

        <Text style={styles.label}>Media Type *</Text>
        <View style={styles.typeButtons}>
          {Object.values(MediaType).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                media.media_type === type && styles.selectedTypeButton,
              ]}
              onPress={() => setMedia({ ...media, media_type: type })}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  media.media_type === type && styles.selectedTypeButtonText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>URL</Text>
        <TextInput
          style={styles.input}
          value={media.url}
          onChangeText={(text) => setMedia({ ...media, url: text })}
          placeholder="Enter URL"
          keyboardType="url"
        />

        <Text style={styles.label}>Plot</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={media.plot}
          onChangeText={(text) => setMedia({ ...media, plot: text })}
          placeholder="Enter plot"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Chapters</Text>
        <TextInput
          style={styles.input}
          value={media.chapters}
          onChangeText={(text) => setMedia({ ...media, chapters: text })}
          placeholder="Enter chapters"
        />

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add Media'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  selectedTypeButton: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    color: '#333',
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 4,
    marginTop: 24,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
}); 