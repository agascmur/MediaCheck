from rest_framework import serializers
from .models import Media, UserMedia, User

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['id', 'title', 'media_type', 'url', 'plot', 'chapters', 'quotes', 'score', 'created_at']

class UserMediaSerializer(serializers.ModelSerializer):
    media = MediaSerializer(read_only=True)
    
    class Meta:
        model = UserMedia
        fields = ['id', 'media', 'state', 'score', 'added_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email'] 