"""
URL configuration for mysite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from media import views as media_views

class CustomLoginView(auth_views.LoginView):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_authenticated'] = self.request.user.is_authenticated
        return context

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('media.urls')),  # This includes the home view
    path('login/', CustomLoginView.as_view(template_name='media/login.html', next_page='/my-collection/'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),
    path('register/', media_views.register, name='register'),
    path('my-collection/', media_views.user_collection, name='user_collection'),
    path('rate/<int:media_id>/', media_views.rate_media, name='rate_media'),
    path('update-state/<int:media_id>/', media_views.update_media_state, name='update_media_state'),
]