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

# Create your views here.
class AuthURL(APIView):
    def get(self, request, format=None):
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
        return redirect('http://localhost:3000/?authorized=false')

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

    if not request.session.exists(request.session.session_key):
        request.session.create()

    update_or_create_user_tokens(request.session.session_key, access_token, token_type, expires_in, refresh_token)

    return redirect('http://localhost:3000/?authorized=true')

class IsAuthenticated(APIView):
    def get(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)
        return Response({'status' : is_authenticated}, status=status.HTTP_200_OK)


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
        
def get_message(request):
    message = Message.objects.first()
    return JsonResponse({"text": message.text if message else "No message found"})