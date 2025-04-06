from django import forms
from django.core.validators import URLValidator, MinLengthValidator
from django.core.exceptions import ValidationError
from .models import Media, UserMedia
import re
from difflib import SequenceMatcher

class MediaForm(forms.ModelForm):
    class Meta:
        model = Media
        fields = ['title', 'media_type', 'url', 'plot', 'chapters', 'quotes']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter the exact title',
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'top',
                'title': 'Enter the exact title as it appears officially'
            }),
            'media_type': forms.Select(attrs={
                'class': 'form-select',
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'top',
                'title': 'Select the correct media type'
            }),
            'url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': 'https://...',
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'top',
                'title': 'Official website or reliable source'
            }),
            'plot': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Enter a brief but informative description',
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'top',
                'title': 'Write a clear description that helps others understand the media'
            }),
            'chapters': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g., 700 chapters',
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'top',
                'title': 'For manga/series only. Enter the total number of chapters'
            }),
            'quotes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Enter one memorable quote per line',
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'top',
                'title': 'Add memorable quotes that represent the media well'
            }),
        }

    def _normalize_title(self, title):
        """Normalize title for comparison"""
        # Convert to lowercase
        title = title.lower()
        # Remove special characters and extra spaces
        title = re.sub(r'[^\w\s]', '', title)
        # Replace multiple spaces with single space
        title = re.sub(r'\s+', ' ', title)
        return title.strip()

    def _similarity_ratio(self, str1, str2):
        """Calculate similarity ratio between two strings"""
        return SequenceMatcher(None, str1, str2).ratio()

    def clean_title(self):
        title = self.cleaned_data.get('title', '').strip()
        if not title:
            raise ValidationError('Title is required')
        
        # Basic validation
        if len(title) < 2:
            raise ValidationError('Title is too short')
        if len(title) > 200:
            raise ValidationError('Title is too long')
        if any(char.isdigit() for char in title) and len(title) < 5:
            raise ValidationError('Title seems too short for a numeric title')

        # Get media type for context
        media_type = self.cleaned_data.get('media_type')
        if not media_type:
            return title

        # Normalize the input title
        normalized_title = self._normalize_title(title)
        
        # Get all existing titles of the same media type
        existing_media = Media.objects.filter(media_type=media_type).exclude(
            pk=self.instance.pk if self.instance else None
        )
        
        # Check for exact matches (case-insensitive)
        exact_matches = existing_media.filter(title__iexact=title)
        if exact_matches.exists():
            raise ValidationError(
                f'A {media_type} with this exact title already exists. '
                'Please check if it\'s the same media.'
            )
        
        # Check for similar titles
        similar_titles = []
        for media in existing_media:
            normalized_existing = self._normalize_title(media.title)
            similarity = self._similarity_ratio(normalized_title, normalized_existing)
            
            # If similarity is high (e.g., > 0.85), consider it a potential duplicate
            if similarity > 0.85:
                similar_titles.append((media.title, similarity))
        
        if similar_titles:
            # Sort by similarity
            similar_titles.sort(key=lambda x: x[1], reverse=True)
            suggestions = [f"'{title}' ({similarity:.0%} similar)" for title, similarity in similar_titles[:3]]
            raise ValidationError(
                'This title is very similar to existing entries. '
                'Please check if you meant one of these: ' + 
                ', '.join(suggestions) +
                '. If this is a different media, please make the title more distinct.'
            )
        
        return title

    def clean_url(self):
        url = self.cleaned_data.get('url', '').strip()
        if url:
            # Validate URL format
            validator = URLValidator()
            try:
                validator(url)
            except ValidationError:
                raise ValidationError('Please enter a valid URL starting with http:// or https://')
            
            # Check for suspicious domains
            suspicious_domains = ['spam.com', 'malicious.com']  # Add more as needed
            if any(domain in url.lower() for domain in suspicious_domains):
                raise ValidationError('This URL appears to be from a suspicious source')
                
        return url

    def clean_plot(self):
        plot = self.cleaned_data.get('plot', '').strip()
        if plot:
            # Check for minimum length
            if len(plot) < 20:
                raise ValidationError('Plot description is too short. Please provide more details.')
            if len(plot) > 2000:
                raise ValidationError('Plot description is too long. Please keep it concise.')
            
            # Check for suspicious content
            if any(word in plot.lower() for word in ['spam', 'scam', 'hack']):
                raise ValidationError('Plot description contains suspicious content')
                
        return plot

    def clean_chapters(self):
        chapters = self.cleaned_data.get('chapters')
        if chapters is None:
            return ''
            
        chapters = chapters.strip()
        if not chapters:
            return ''
            
        # Only validate if media type is manga
        if self.cleaned_data.get('media_type') == 'manga':
            try:
                # Extract number from string (e.g., "700 chapters" -> 700)
                num = int(''.join(filter(str.isdigit, chapters)))
                if num <= 0:
                    raise ValidationError('Number of chapters must be positive')
                if num > 10000:
                    raise ValidationError('Number of chapters seems unrealistic')
            except ValueError:
                raise ValidationError('Please enter a valid number of chapters')
        else:
            # Clear chapters if not manga
            return ''
        return chapters

    def clean_quotes(self):
        quotes = self.cleaned_data.get('quotes')
        if quotes is None:
            return []
            
        # If quotes is a string (from form input), split it into lines
        if isinstance(quotes, str):
            quotes = [quote.strip() for quote in quotes.split('\n') if quote.strip()]
        
        # Validate each quote
        valid_quotes = []
        for quote in quotes:
            quote = str(quote).strip()
            if not quote:
                continue
                
            if len(quote) < 10:
                raise ValidationError('Quotes should be at least 10 characters long')
            if len(quote) > 500:
                raise ValidationError('Quotes should not exceed 500 characters')
            if any(word in quote.lower() for word in ['spam', 'scam', 'hack']):
                raise ValidationError('Some quotes contain suspicious content')
                
            valid_quotes.append(quote)
            
        return valid_quotes