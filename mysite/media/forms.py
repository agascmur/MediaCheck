from django import forms
from .models import Media, UserMedia

class MediaForm(forms.ModelForm):
    class Meta:
        model = Media
        fields = ['title', 'media_type', 'url', 'plot', 'chapters', 'quotes']
        widgets = {
            'plot': forms.Textarea(attrs={'rows': 4}),
            'quotes': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Enter quotes separated by newlines'}),
        }

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if Media.objects.filter(title__iexact=title).exists():
            raise forms.ValidationError('A media with this title already exists.')
        return title

    def clean_quotes(self):
        quotes = self.cleaned_data.get('quotes', '')
        if quotes:
            # Split quotes by newlines and strip whitespace
            quotes_list = [quote.strip() for quote in quotes.split('\n') if quote.strip()]
            return quotes_list
        return [] 