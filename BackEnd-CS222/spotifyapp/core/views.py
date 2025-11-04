from django.shortcuts import render, redirect
from rest_framework.views import APIView
from . models import *
from rest_framework.response import Response
from . serializer import *
from . credentials import REDIRECT_URI, CLIENT_ID, CLIENT_SECRET
from requests import Request, post
from rest_framework import status
from .util import update_or_create_user_tokens, is_spotify_authenticated
from django.http import JsonResponse
from core.models import Message
from .util import update_or_create_user_tokens, is_spotify_authenticated, get_user_tokens


# Create your views here.
class AuthURL(APIView):
    def get(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        # Touch the session so Django definitely sets the cookie
        request.session['spotify_flow'] = 'starting'   # harmless flag
        request.session.save()
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type' : 'code',
            'redirect_uri' : REDIRECT_URI,
            'client_id' : CLIENT_ID
        }).prepare().url
        return Response({'url' : url}, status=status.HTTP_200_OK)
    
def spotify_callback(request, format=None):
    if not request.session.session_key:
        request.session.create()
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error:
        # Send user back with a failure flag
        return redirect('http://127.0.0.1:3000/?authorized=false')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type' : 'authorization_code',
        'code' : code,
        'redirect_uri' : REDIRECT_URI,
        'client_id' : CLIENT_ID,
        'client_secret' : CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')

    if not access_token:
        return redirect('http://127.0.0.1:3000/?authorized=false')

    # Save tokens tied to the current session key
    update_or_create_user_tokens(
        request.session.session_key,
        access_token,
        token_type,
        expires_in,
        refresh_token,
    )

    # Touch + save session so Set-Cookie is guaranteed in this response
    request.session['spotify_authed'] = True
    request.session.save()

    return redirect('http://127.0.0.1:3000/?authorized=true')

class IsAuthenticated(APIView):
    def get(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)
        return Response({'status' : is_authenticated}, status=status.HTTP_200_OK)
    
class Logout(APIView):
    def post(self, request, format=None):
        # Ensure there is a session key to delete tokens under
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key

        SpotifyToken.objects.filter(user=session_key).delete()

        # Blow away the session (cookie cleared)
        request.session.flush()

        # Immediately create a brand new empty session so the browser
        # has a fresh cookie for the very next action (e.g., get-auth-url)
        request.session.create()
        request.session['logged_out'] = True
        request.session.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ReactView(APIView):
    serializer_class = ReactSerializer
    def get(self, request):
        detail = [ {"name": detail.name,"detail": detail.detail}
        for detail in React.objects.all()]
        return Response(detail)
    
    def post(self, request):
        serializer = ReactSerializer(data=request.data)
        if (serializer.is_valid(raise_exception=True)):
            serializer.save()
            return Response(serializer.data)
        
class SongView(APIView):
    def get(self, request):
        songs = Song.objects.all().order_by("id")
        serializer = SongSerializer(songs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SongSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
def get_message(request):
    message = Message.objects.first()
    return JsonResponse({"text": message.text if message else "No message found"})

