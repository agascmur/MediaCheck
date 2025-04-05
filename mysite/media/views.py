from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Avg
from django.contrib.auth import login
from .models import Media, UserMedia, User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

def home(request):
    # Get all media items with their average scores
    media_items = Media.objects.annotate(
        avg_score=Avg('user_media__score')
    ).order_by('-avg_score', '-created_at')

    # Get user's ratings if user is logged in
    user_ratings = {}
    if hasattr(request, 'user') and request.user.is_authenticated:
        # Get all ratings for the current user
        ratings = UserMedia.objects.filter(
            user=request.user,
            score__isnull=False
        ).select_related('media')
        
        # Create a dictionary of media_id -> score
        user_ratings = {rating.media_id: rating.score for rating in ratings}

    context = {
        'media_items': media_items,
        'user_ratings': user_ratings,
        'is_authenticated': hasattr(request, 'user') and request.user.is_authenticated,
        'user_media_states': UserMedia.MediaState.choices,
    }
    return render(request, 'media/home.html', context)

@login_required
def user_collection(request):
    # Get all media items in the user's collection except those with state CHECK
    user_media = UserMedia.objects.filter(
        user=request.user
    ).exclude(
        state=UserMedia.MediaState.CHECK
    ).select_related('media')
    
    # Get user's ratings
    user_ratings = {
        rating.media_id: rating.score 
        for rating in user_media.filter(score__isnull=False)
    }
    
    context = {
        'user_media': user_media,
        'user_ratings': user_ratings,
        'is_authenticated': True,
        'user_media_states': UserMedia.MediaState.choices,
    }
    return render(request, 'media/user_collection.html', context)

@login_required
def rate_media(request, media_id):
    media = get_object_or_404(Media, id=media_id)
    
    if request.method == 'POST':
        score = request.POST.get('score')
        # Convert score to float if it's not empty
        if score is not None and score != '':
            score = float(score)
            if score < 0 or score > 10:
                return render(request, 'media/rate_media.html', {
                    'media': media,
                    'error': 'Score must be between 0 and 10'
                })
        else:
            score = None
        
        # Get or create UserMedia entry
        user_media, created = UserMedia.objects.get_or_create(
            user=request.user,
            media=media,
            defaults={'score': score}
        )
        
        if not created:
            user_media.score = score
            user_media.save()
        
        # Redirect back to the previous page
        next_url = request.POST.get('next')
        if next_url and next_url.startswith('/'):  # Only redirect to internal URLs
            return redirect(next_url)
        return redirect('home')
    
    # Get current rating if it exists
    current_rating = None
    try:
        user_media = UserMedia.objects.get(user=request.user, media=media)
        current_rating = user_media.score
    except UserMedia.DoesNotExist:
        pass
    
    context = {
        'media': media,
        'current_rating': current_rating,
        'next': request.GET.get('next'),
        'is_authenticated': True,
    }
    return render(request, 'media/rate_media.html', context)

@login_required
def update_media_state(request, media_id):
    if request.method == 'POST':
        media = get_object_or_404(Media, id=media_id)
        new_state = int(request.POST.get('state', 0))
        
        # Get or create UserMedia entry
        user_media, created = UserMedia.objects.get_or_create(
            user=request.user,
            media=media,
            defaults={'state': new_state}
        )
        
        if not created:
            user_media.state = new_state
            # If state is changed to CHECK, clear the rating
            if new_state == UserMedia.MediaState.CHECK:
                user_media.score = None
            user_media.save()
            
            # If rating was cleared, recalculate media's average score
            if new_state == UserMedia.MediaState.CHECK:
                media.calculate_score()
        
        # If this is an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            response_data = {
                'status': 'success',
                'state_display': user_media.get_state_display_with_icon(),
                'state': new_state,
                'is_check_state': new_state == UserMedia.MediaState.CHECK,
                'score': user_media.score
            }
            return JsonResponse(response_data)
            
        # Redirect back to the previous page
        next_url = request.POST.get('next')
        if next_url and next_url.startswith('/'):  # Only redirect to internal URLs
            return redirect(next_url)
        return redirect('home')

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        if User.objects.filter(username=username).exists():
            return render(request, 'media/register.html', {
                'error': 'Username already exists'
            })
        
        if User.objects.filter(email=email).exists():
            return render(request, 'media/register.html', {
                'error': 'Email already exists'
            })
        
        user = User.objects.create(
            username=username,
            email=email
        )
        user.set_password(password)
        user.save()
        
        login(request, user)
        return redirect('user_collection')  # Redirect to user's collection after registration
    
    return render(request, 'media/register.html')
