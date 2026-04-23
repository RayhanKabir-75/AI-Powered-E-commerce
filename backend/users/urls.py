from django.urls import path
from . import views
from .views import forgot_password, reset_password, logout, csrf

urlpatterns = [
    path('register/', views.register),
    path('login/',    views.login),
    path('logout/', logout, name='logout'),
    path('profile/',  views.profile),
    path('google/',   views.google_auth),
    path('forgot-password/', forgot_password),
    path('reset-password/<uidb64>/<token>/', reset_password),
    path('csrf/', csrf),
]