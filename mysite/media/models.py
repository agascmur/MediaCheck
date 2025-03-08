from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from enum import Enum

class MediaType(Enum):
    CINEMA = 'cinema'
    SERIES = 'series'
    MANGA = 'manga'
    MUSIC = 'music'

    @classmethod
    def choices(cls):
        return [(tag.value, tag.name.capitalize()) for tag in cls]

class Media(models.Model):
    title = models.CharField(max_length=255)
    media_type = models.CharField(max_length=50, choices=MediaType.choices(), default=MediaType.CINEMA.value)
    url = models.TextField(blank=True, null=True)  # Optional field for external links
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.media_type})"

class User(models.Model):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # Store the hashed password

    def set_password(self, raw_password):
        """Hash the password before saving it."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if the raw password matches the hashed password."""
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username

class UserMedia(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    media = models.ForeignKey(Media, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'media')

    def __str__(self):
        return f"{self.user.username} - {self.media.title}"
