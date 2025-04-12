from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Avg
from django.contrib.auth import login, authenticate
from .models import Media, UserMedia, User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages
from .forms import MediaForm
from rest_framework import viewsets, permissions, status
from .serializers import MediaSerializer, UserMediaSerializer
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@api_view(['POST'])
@permission_classes([AllowAny])
def obtain_auth_token(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username is None or password is None:
        return Response({'error': 'Please provide both username and password'},
                        status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({'error': 'Invalid credentials'},
                        status=status.HTTP_401_UNAUTHORIZED)
    
    token, created = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})

from django.db.models import Avg, Q, Prefetch
from .models import Media, UserMedia

def home(request):
    query = request.GET.get('q', '')
    selected_state = request.GET.get('state')

    # Start base queryset
    media_qs = Media.objects.all()

    # Apply search filter if query is present
    if query:
        media_qs = media_qs.filter(title__icontains=query)

    # Apply state filter only if user is authenticated and valid state
    if request.user.is_authenticated and selected_state in ['1', '2', '3']:
        media_qs = media_qs.prefetch_related(
            Prefetch(
                'user_media',
                queryset=UserMedia.objects.filter(user=request.user),
                to_attr='filtered_user_media'
            )
        )
        media_items = []
        for media in media_qs:
            # Use prefetched data to check if media is in desired state
            if hasattr(media, 'filtered_user_media') and media.filtered_user_media:
                user_media = media.filtered_user_media[0]
                if user_media.state == int(selected_state):
                    media_items.append(media)
    else:
        media_items = list(media_qs)

    # Annotate with avg score and sort
    media_items = sorted(
        media_items,
        key=lambda m: (
            -(m.user_media.aggregate(avg_score=Avg('score'))['avg_score'] or 0),
            -m.created_at.timestamp()
        )
    )

    # User rating dict
    user_ratings = {}
    if request.user.is_authenticated:
        ratings = UserMedia.objects.filter(
            user=request.user,
            score__isnull=False
        ).select_related('media')
        user_ratings = {r.media_id: r.score for r in ratings}

    context = {
        'media_items': media_items,
        'user_ratings': user_ratings,
        'is_authenticated': request.user.is_authenticated,
        'user_media_states': UserMedia.MediaState.choices,
        'selected_state': selected_state,
        'query': query,
    }
    return render(request, 'media/home.html', context)

@login_required

def user_collection(request):
    query = request.GET.get('q', '')
    selected_state = request.GET.get('state')

    # Start with all user media excluding "Check" state
    user_media_qs = UserMedia.objects.filter(
        user=request.user
    ).exclude(
        state=UserMedia.MediaState.CHECK
    ).select_related('media')

    # Filter by search query
    if query:
        user_media_qs = user_media_qs.filter(media__title__icontains=query)

    # Filter by selected state if provided and valid
    if selected_state in ['1', '2', '3']:
        user_media_qs = user_media_qs.filter(state=int(selected_state))

    # Build user ratings dict
    user_ratings = {
        rating.media_id: rating.score 
        for rating in user_media_qs.filter(score__isnull=False)
    }

    context = {
        'user_media': user_media_qs,
        'user_ratings': user_ratings,
        'is_authenticated': True,
        'user_media_states': UserMedia.MediaState.choices,
        'selected_state': selected_state,
        'query': query,
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
        
        # Create a token for the user
        Token.objects.create(user=user)
        
        login(request, user)
        return redirect('media:user_collection')
    
    return render(request, 'media/register.html', {
        'is_authenticated': request.user.is_authenticated
    })

@login_required
def create_media(request):
    if request.method == 'POST':
        form = MediaForm(request.POST)
        if form.is_valid():
            # Check if media with same title and type already exists
            title = form.cleaned_data['title']
            media_type = form.cleaned_data['media_type']
            
            if Media.objects.filter(title__iexact=title, media_type=media_type).exists():
                messages.error(request, 'A media with this title and type already exists.')
                return render(request, 'media/create_media.html', {'form': form})
            
            # Create the media entry
            media = form.save()
            
            # Create UserMedia entry for the creator
            UserMedia.objects.create(
                user=request.user,
                media=media,
                state=UserMedia.MediaState.CHECKED
            )
            
            messages.success(request, 'Media created successfully!')
            return redirect('media:home')
    else:
        form = MediaForm()
    
    return render(request, 'media/create_media.html', {
        'form': form,
        'is_authenticated': request.user.is_authenticated
    })

class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter media based on user's collection if requested
        user_collection = self.request.query_params.get('user_collection', None)
        if user_collection and self.request.user.is_authenticated:
            return Media.objects.filter(user_media__user=self.request.user)
        return Media.objects.all()

    def perform_create(self, serializer):
        # Get the title and media_type from the request data
        title = serializer.validated_data.get('title', '').strip()
        media_type = serializer.validated_data.get('media_type')
        
        # Check for existing media with the same title and type
        if Media.objects.filter(title__iexact=title, media_type=media_type).exists():
            raise serializers.ValidationError({
                'title': f'A {media_type} with this exact title already exists. Please check if it\'s the same media.'
            })
        
        # If no duplicate found, save the media
        serializer.save()

class UserMediaViewSet(viewsets.ModelViewSet):
    serializer_class = UserMediaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserMedia.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def get_token(self, request):
        token, created = Token.objects.get_or_create(user=request.user)
        return Response({'token': token.key})

# API offline
class UserExistsView(APIView):
    def get(self, request, username, *args, **kwargs):
        exists = User.objects.filter(username=username).exists()
        if exists:
            return JsonResponse({'exists': exists}, status=200)
        else:
            return JsonResponse({'exists': exists}, status=404)

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    def post(self, request):
        import json
        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(username=username, email=email)
        user.set_password(password)
        user.save()
        Token.objects.create(user=user)

        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)