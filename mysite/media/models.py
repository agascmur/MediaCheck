from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password
from django.core.validators import MinValueValidator, MaxValueValidator, URLValidator
from enum import Enum
from django.db.models import Avg, Count
from django.core.exceptions import ValidationError

class User(AbstractUser):
    # We can add custom fields here if needed
    pass

class Media(models.Model):
    class MediaType(models.TextChoices):
        CINEMA = 'cinema', 'Cinema'
        SERIES = 'series', 'Series'
        MANGA = 'manga', 'Manga'
        MUSIC = 'music', 'Music'

    title = models.CharField(max_length=255, db_index=True)
    media_type = models.CharField(
        max_length=50, 
        choices=MediaType.choices, 
        default=MediaType.CINEMA,
        db_index=True
    )
    url = models.TextField(
        blank=True, 
        null=True,
        validators=[URLValidator()]  # Validate URL format
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    plot = models.TextField(blank=True, null=True)
    chapters = models.CharField(max_length=255, blank=True, null=True)
    quotes = models.JSONField(default=list, blank=True)
    score = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title', 'media_type']),
            models.Index(fields=['created_at', 'media_type']),
        ]

    def calculate_score(self):
        """Calculate the average score from all ratings"""
        avg_score = self.user_media.filter(score__isnull=False).aggregate(Avg('score'))['score__avg']
        self.score = avg_score
        self.save()
        return avg_score

    def get_user_rating(self, user):
        """Get a specific user's rating for this media"""
        try:
            return self.user_media.get(user=user).score
        except UserMedia.DoesNotExist:
            return None

    def has_user_rated(self, user):
        """Check if a user has rated this media"""
        return self.user_media.filter(user=user, score__isnull=False).exists()

    def get_rating_stats(self):
        """Get statistics about ratings"""
        stats = self.user_media.filter(score__isnull=False).aggregate(
            avg_score=Avg('score'),
            total_ratings=Count('score')
        )
        return {
            'average': stats['avg_score'] or 0,
            'total': stats['total_ratings'] or 0
        }

    def clean(self):
        """Validate the model data"""
        if self.url and not self.url.startswith(('http://', 'https://')):
            raise ValidationError('URL must start with http:// or https://')

    def __str__(self):
        return f"{self.title} ({self.media_type})"

class UserMedia(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_media')
    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='user_media')
    added_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(
        null=True, 
        blank=True,
        validators=[
            MinValueValidator(0.0, message="Score must be at least 0"),
            MaxValueValidator(10.0, message="Score cannot exceed 10")
        ]
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'media')
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'media']),
            models.Index(fields=['score']),
        ]

    def save(self, *args, **kwargs):
        if self.score is not None:
            if self.score < 0 or self.score > 10:
                raise ValueError("Score must be between 0 and 10")
        super().save(*args, **kwargs)
        # Update the media's average score if this is a rating
        if self.score is not None:
            self.media.calculate_score()

    def get_rating_status(self):
        """Get the current rating status"""
        if self.score is None:
            return "Not rated"
        return f"Rated {self.score}/10"

    def __str__(self):
        rating_str = f" rated {self.score}" if self.score is not None else ""
        return f"{self.user.username}'s {self.media.title}{rating_str}"
