from django.shortcuts import render, redirect
from rest_framework.views import APIView
from . models import *
from rest_framework.response import Response
from . serializer import *
from . credentials import REDIRECT_URI, CLIENT_ID, CLIENT_SECRET
from requests import Request, post
from rest_framework import status
from django.http import JsonResponse
from core.models import Message
from .util import update_or_create_user_tokens, is_spotify_authenticated, get_user_tokens, spotify_api_request, spotify_add_to_queue, spotify_search_track_uri

from .openai_client import get_song_recommendations_from_gpt

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

class ClearSongs(APIView):
    def post(self, request):
        Song.objects.all().delete()
        return Response({"ok": True}, status=status.HTTP_200_OK)
        
def get_message(request):
    message = Message.objects.first()
    return JsonResponse({"text": message.text if message else "No message found"})

class Devices(APIView):
    def get(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        code, data = spotify_api_request(request.session.session_key, "GET", "/me/player/devices")
        return Response(data, status=code or status.HTTP_401_UNAUTHORIZED)

class SearchTracks(APIView):
    def get(self, request, format=None):
        if not request.session.session_key:
            request.session.session_key or request.session.create()

        q = (request.GET.get("q") or "").strip()
        if not q:
            return Response({"error": "missing q"}, status=status.HTTP_400_BAD_REQUEST)

        params = {"q": q, "type": "track", "limit": 10}
        code, data = spotify_api_request(request.session.session_key, "GET", "/search", params=params)

        items = []
        for t in (data.get("tracks", {}).get("items", []) if data else []):
            items.append({
                "id": t.get("id"),
                "uri": t.get("uri"),
                "name": t.get("name"),
                "artist": ", ".join(a["name"] for a in t.get("artists", [])),
                "album": (t.get("album") or {}).get("name"),
                "image": ((t.get("album") or {}).get("images") or [{}])[0].get("url"),
            })
        return Response({"items": items}, status=code or status.HTTP_401_UNAUTHORIZED)

# GPT Song Rec
class GPTSongRecView(APIView):
    """
    POST { "prompt": "happy cheerful spring songs" }
    """

    def post(self, request):
        prompt = request.data.get("prompt", "").strip()
        if not prompt:
            return Response(
                {"error": "Missing 'prompt' field"},
                status=status.HTTP_400_BAD_REQUEST
            )

        songs_data = get_song_recommendations_from_gpt(prompt)  

        created_songs = []
        for s in songs_data:
            title = s.get("title")
            artist = s.get("artist")
            if title and artist:
                created_songs.append(
                    Song.objects.create(title=title, artist=artist, source="gpt", prompt=prompt)
                )

        serializer = SongSerializer(created_songs, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class Play(APIView):
    def put(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        uri = request.data.get("uri")
        device_id = request.data.get("device_id")
        if not uri:
            return Response({"error": "missing uri"}, status=status.HTTP_400_BAD_REQUEST)

        params = {"device_id": device_id} if device_id else None
        body = {"uris": [uri]}
        code, data = spotify_api_request(request.session.session_key, "PUT", "/me/player/play", json=body, params=params)
        # 204 is success here
        return Response(data or {}, status=code or status.HTTP_401_UNAUTHORIZED)

class Pause(APIView):
    def put(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        device_id = request.data.get("device_id")
        params = {"device_id": device_id} if device_id else None
        code, data = spotify_api_request(request.session.session_key, "PUT", "/me/player/pause", params=params)
        return Response(data or {}, status=code or status.HTTP_401_UNAUTHORIZED)
    
class QueueLatestFiveSongs(APIView):
    def post(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key

        # Get the latest 5 songs you saved (by timestamp desc)
        songs = list(Song.objects.order_by("-timestamp")[:5])  # title, artist, timestamp

        if not songs:
            return Response({"error": "No songs found to queue."}, status=404)

        device_id = request.data.get("device_id")
        results = []
        for s in reversed(songs):  # keep original chronological order when queuing
            uri = spotify_search_track_uri(session_key, s.title, s.artist)
            if not uri:
                results.append({"title": s.title, "artist": s.artist, "uri": None, "status": 404})
                continue
            code, data = spotify_add_to_queue(session_key, uri, device_id=device_id)
            results.append({"title": s.title, "artist": s.artist, "uri": uri, "status": code})

        ok = all(r["status"] == 204 for r in results if r["uri"])
        return Response({"queued": results}, status=200 if ok else 207)


class PlayPauseToggle(APIView):
    def post(self, request, format=None):
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key

        code, data = spotify_api_request(session_key, "GET", "/me/player/currently-playing")
        is_playing = isinstance(data, dict) and data.get("is_playing")

        if is_playing:
            code2, data2 = spotify_api_request(session_key, "PUT", "/me/player/pause")
            new_state = False
        else:
            code2, data2 = spotify_api_request(session_key, "PUT", "/me/player/play")
            new_state = True

        return Response({"is_playing": new_state}, status=code2 or 200)



#new 
class ClearSongs(APIView):
    def post(self, request, format=None):
        Song.objects.all().delete()
        return Response({"ok": True}, status=status.HTTP_200_OK)


class QueueURI(APIView):
    """
    POST /queue-uri/
    Body: { "uri": "spotify:track:...", "device_id": "optional" }
    """
    def post(self, request, format=None):
        if not request.session.session_key:
            request.session.create()

        uri = request.data.get("uri")
        device_id = request.data.get("device_id")

        if not uri:
            return Response({"error": "missing uri"}, status=status.HTTP_400_BAD_REQUEST)

        code, data = spotify_add_to_queue(request.session.session_key, uri, device_id=device_id)
        return Response(data or {}, status=code or status.HTTP_401_UNAUTHORIZED)


class SaveManualSong(APIView):
    def post(self, request, format=None):
        title = (request.data.get("title") or "").strip()
        artist = (request.data.get("artist") or "").strip()
        uri = (request.data.get("uri") or "").strip()  # you accept it already

        if not title or not artist:
            return Response({"error": "missing title/artist"}, status=status.HTTP_400_BAD_REQUEST)

        s = Song.objects.create(
            title=title,
            artist=artist,
            source="manual",
            prompt="Manual song search",
        )
        return Response(SongSerializer(s).data, status=status.HTTP_201_CREATED)



class PlaySongFromHistory(APIView):
    """
    POST /songs/<id>/play/
    Optional body: { "device_id": "..." }
    """
    def post(self, request, song_id, format=None):
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key

        device_id = request.data.get("device_id")
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)

        uri = spotify_search_track_uri(session_key, song.title, song.artist)
        if not uri:
            return Response({"error": "Could not find track on Spotify"}, status=status.HTTP_404_NOT_FOUND)

        params = {"device_id": device_id} if device_id else None
        body = {"uris": [uri]}
        code, data = spotify_api_request(session_key, "PUT", "/me/player/play", json=body, params=params)
        return Response(data or {}, status=code or status.HTTP_401_UNAUTHORIZED)


class QueueSongFromHistory(APIView):
    """
    POST /songs/<id>/queue/
    Optional body: { "device_id": "..." }
    """
    def post(self, request, song_id, format=None):
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key

        device_id = request.data.get("device_id")
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)

        uri = spotify_search_track_uri(session_key, song.title, song.artist)
        if not uri:
            return Response({"error": "Could not find track on Spotify"}, status=status.HTTP_404_NOT_FOUND)

        code, data = spotify_add_to_queue(session_key, uri, device_id=device_id)
        return Response(data or {}, status=code or status.HTTP_401_UNAUTHORIZED)