from rest_framework import serializers
from .models import Media, UserMedia, User

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['id', 'title', 'media_type', 'url', 'plot', 'chapters', 'quotes', 'score', 'created_at']

class UserMediaSerializer(serializers.ModelSerializer):
    media = MediaSerializer(read_only=True)
    media_id = serializers.IntegerField(write_only=True, required=True)
    
    class Meta:
        model = UserMedia
        fields = ['id', 'media', 'media_id', 'state', 'score', 'added_at', 'updated_at']
    
    def validate_media_id(self, value):
        try:
            Media.objects.get(id=value)
            return value
        except Media.DoesNotExist:
            raise serializers.ValidationError("Media with this ID does not exist")
    
    def create(self, validated_data):
        media_id = validated_data.pop('media_id')
        media = Media.objects.get(id=media_id)
        return UserMedia.objects.create(
            user=self.context['request'].user,
            media=media,
            **validated_data
        )

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email'] 