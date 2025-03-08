from django.contrib import admin
from .models import User, Media, UserMedia

admin.site.register(User)
admin.site.register(Media)
admin.site.register(UserMedia)