from django.core.management.base import BaseCommand
from media.models import User, Media, UserMedia
from django.contrib.auth.hashers import make_password
from django.db import connection
from datetime import datetime

class Command(BaseCommand):
    help = 'Erase and restore test data for the testing environment'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['erase', 'restore', 'reset'],
            help='Action to perform: erase (just data), restore (sample data), or reset (erase + restore)'
        )

    def handle(self, *args, **options):
        action = options['action']

        if action == 'erase':
            self.erase_data()
        elif action == 'restore':
            self.restore_data()
        elif action == 'reset':
            self.erase_data()
            self.restore_data()

    def erase_data(self):
        # Erase all test data in a safe order
        UserMedia.objects.all().delete()
        Media.objects.all().delete()
        User.objects.all().delete()
        
        # Reset auto-increment counters
        with connection.cursor() as cursor:
            # Get all tables in the database
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            # Reset sequence for each table
            for table in tables:
                table_name = table[0]
                cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table_name}'")
                cursor.execute(f"UPDATE sqlite_sequence SET seq=0 WHERE name='{table_name}'")
        
        self.stdout.write(self.style.SUCCESS("Successfully erased all test data."))

    def restore_data(self):
        # Restore sample data for testing

        # Create Users with realistic data
        user1 = User.objects.create(
            username="john_doe",
            email="john.doe@example.com",
            password=make_password("john1234"),
            first_name="John",
            last_name="Doe",
            is_active=True,
            is_staff=False
        )
        user2 = User.objects.create(
            username="jane_smith",
            email="jane.smith@example.com",
            password=make_password("jane5678"),
            first_name="Jane",
            last_name="Smith",
            is_active=True,
            is_staff=False
        )
        user3 = User.objects.create(
            username="bob_jones",
            email="bob.jones@example.com",
            password=make_password("bob9876"),
            first_name="Bob",
            last_name="Jones",
            is_active=True,
            is_staff=False
        )
        user4 = User.objects.create(
            username="aaa",
            email="aaa@example.com",
            password=make_password("aaa"),
            first_name="aaa",
            last_name="aaa",
            is_active=True,
            is_staff=False
        )

        # Create Media entries with realistic data
        media1 = Media.objects.create(
            title="Inception",
            media_type="cinema",
            url="https://example.com/inception",
            plot="A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            quotes=["Your mind is the scene of the crime.", "You mustn't be afraid to dream a little bigger, darling."]
        )
        media2 = Media.objects.create(
            title="Breaking Bad",
            media_type="series",
            url="https://example.com/breakingbad",
            plot="A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family's financial future as he battles terminal lung cancer.",
            quotes=["I am the one who knocks!", "Say my name."]
        )
        media3 = Media.objects.create(
            title="Naruto",
            media_type="manga",
            url="https://example.com/naruto",
            plot="A young ninja seeks to become the strongest leader in his village while seeking the recognition he never had.",
            chapters="700 chapters",
            quotes=["Believe it!", "I never go back on my word. That's my nindo, my ninja way!"]
        )
        media4 = Media.objects.create(
            title="Bohemian Rhapsody",
            media_type="music",
            url="https://example.com/bohemianrhapsody",
            plot="The story of the legendary rock band Queen and lead singer Freddie Mercury, leading up to their famous performance at Live Aid (1985).",
            quotes=["We will, we will rock you!", "I want to break free!"]
        )

        # Associate Users with Media and add ratings
        # User1's collection and ratings
        UserMedia.objects.create(user=user1, media=media1, score=9.5)  # john_doe rates Inception
        UserMedia.objects.create(user=user1, media=media2, score=10.0)  # john_doe rates Breaking Bad
        UserMedia.objects.create(user=user1, media=media3)  # john_doe adds Naruto to collection without rating

        # User2's collection and ratings
        UserMedia.objects.create(user=user2, media=media3, score=8.5)  # jane_smith rates Naruto
        UserMedia.objects.create(user=user2, media=media4, score=9.0)  # jane_smith rates Bohemian Rhapsody
        UserMedia.objects.create(user=user2, media=media1)  # jane_smith adds Inception to collection without rating

        # User3's collection and ratings
        UserMedia.objects.create(user=user3, media=media2, score=9.8)  # bob_jones rates Breaking Bad
        UserMedia.objects.create(user=user3, media=media4, score=8.0)  # bob_jones rates Bohemian Rhapsody
        UserMedia.objects.create(user=user3, media=media3)  # bob_jones adds Naruto to collection without rating

        # Calculate initial scores for all media
        for media in Media.objects.all():
            media.calculate_score()

        self.stdout.write(self.style.SUCCESS("Successfully restored sample test data."))
