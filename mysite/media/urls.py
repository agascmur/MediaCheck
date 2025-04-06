from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'media'

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
] 