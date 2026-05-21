from django.urls import path
from . import views

urlpatterns = [
    path('',        views.list_wishlist,   name='wishlist-list'),
    path('toggle/', views.toggle_wishlist, name='wishlist-toggle'),
]
