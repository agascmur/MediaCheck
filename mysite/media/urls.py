from django.urls import path, include
from django.http import JsonResponse
from django.contrib.auth import views as auth_views
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework.authtoken.views import obtain_auth_token

app_name = 'media'

router = DefaultRouter()
router.register(r'media', views.MediaViewSet, basename='media')
router.register(r'user-media', views.UserMediaViewSet, basename='user-media')


def health_check(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    # Main pages
    path('', views.home, name='home'),
    path('create/', views.create_media, name='create_media'),
    path('my-collection/', views.user_collection, name='user_collection'),
    
    # Authentication
    path('login/', auth_views.LoginView.as_view(
        template_name='media/login.html',
        next_page='media:user_collection'
    ), name='login'),
    path('logout/', auth_views.LogoutView.as_view(
        next_page='media:home'
    ), name='logout'),
    path('register/', views.register, name='register'),
    
    # Media actions
    path('rate/<int:media_id>/', views.rate_media, name='rate_media'),
    path('update-state/<int:media_id>/', views.update_media_state, name='update_media_state'),
    path('api/', include(router.urls)),
    path('api-token-auth/', views.obtain_auth_token, name='api_token_auth'),

    path('health/', health_check),
    path('user-exists/<str:username>/', views.UserExistsView.as_view(), name='user_exists'),
    path('register-App/', views.RegisterView.as_view(), name='register_api'),
] 