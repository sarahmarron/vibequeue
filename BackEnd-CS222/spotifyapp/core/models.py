from django.db import models

# Create your models here.

class React(models.Model):
    name = models.CharField(max_length=30)
    detail = models.CharField(max_length=500)

class SpotifyToken(models.Model): 
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    refresh_token = models.CharField(max_length=150)
    access_token = models.CharField(max_length=150)
    expires_in = models.DateTimeField()
    token_type = models.CharField(max_length=50)

class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    text = models.CharField(max_length=200)

    def __str__(self):
        return self.text