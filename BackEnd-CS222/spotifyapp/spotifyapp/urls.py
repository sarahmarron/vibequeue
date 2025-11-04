"""
URL configuration for spotifyapp project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
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
from core.views import *
from core.views import AuthURL, spotify_callback, IsAuthenticated, get_message
from core.views import AuthURL, spotify_callback, IsAuthenticated, Logout

urlpatterns = [
    path('admin/', admin.site.urls),
    path('wel/', ReactView.as_view(), name="something"),
    path('message/', get_message, name="get-message"),
    path('get-auth-url', AuthURL.as_view()),
    path('get-auth-url/', AuthURL.as_view()),
    path('redirect', spotify_callback),
    path('is-authenticated/', IsAuthenticated.as_view()),
    path('logout/', Logout.as_view())
]
