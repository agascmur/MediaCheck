import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Media, MediaType } from '../types';
import { addMedia } from '../services/database';

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

  const handleSubmit = async () => {
    try {
      if (!media.title || !media.media_type) {
        alert('Title and media type are required');
        return;
      }

      await addMedia(media as Media);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding media:', error);
      alert('Error adding media. Please try again.');
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

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add Media</Text>
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
}); 