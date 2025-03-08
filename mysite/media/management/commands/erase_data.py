from django.core.management.base import BaseCommand
from media.models import User, Media, UserMedia
from django.contrib.auth.hashers import make_password
from datetime import datetime

class Command(BaseCommand):
    help = 'Erase and restore test data for the testing environment'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['erase', 'restore'],
            help='Action to perform: erase or restore data'
        )

    def handle(self, *args, **options):
        action = options['action']

        if action == 'erase':
            self.erase_data()
        elif action == 'restore':
            self.restore_data()

    def erase_data(self):
        # Erase all test data in a safe order
        UserMedia.objects.all().delete()
        Media.objects.all().delete()
        User.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Successfully erased all test data."))

    def restore_data(self):
        # Restore sample data for testing

        # Create Users with realistic data
        user1 = User.objects.create(
            username="john_doe",
            email="john.doe@example.com",
            password=make_password("john1234")  # Example hashed password
        )
        user2 = User.objects.create(
            username="jane_smith",
            email="jane.smith@example.com",
            password=make_password("jane5678")  # Example hashed password
        )
        user3 = User.objects.create(
            username="bob_jones",
            email="bob.jones@example.com",
            password=make_password("bob9876")  # Example hashed password
        )

        # Create Media entries with realistic data
        media1 = Media.objects.create(
            title="Inception",
            media_type="cinema",
            url="https://example.com/inception"
        )
        media2 = Media.objects.create(
            title="Breaking Bad",
            media_type="series",
            url="https://example.com/breakingbad"
        )
        media3 = Media.objects.create(
            title="Naruto",
            media_type="manga",
            url="https://example.com/naruto"
        )
        media4 = Media.objects.create(
            title="Bohemian Rhapsody",
            media_type="music",
            url="https://example.com/bohemianrhapsody"
        )

        # Associate Users with Media
        UserMedia.objects.create(user=user1, media=media1)  # john_doe with Inception
        UserMedia.objects.create(user=user1, media=media2)  # john_doe with Breaking Bad
        UserMedia.objects.create(user=user2, media=media3)  # jane_smith with Naruto
        UserMedia.objects.create(user=user2, media=media4)  # jane_smith with Bohemian Rhapsody
        UserMedia.objects.create(user=user3, media=media2)  # bob_jones with Breaking Bad
        UserMedia.objects.create(user=user3, media=media4)  # bob_jones with Bohemian Rhapsody

        self.stdout.write(self.style.SUCCESS("Successfully restored sample test data."))
