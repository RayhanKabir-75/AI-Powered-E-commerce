from django.urls import path
from .views import generate_description

urlpatterns = [
    path('generate-description/', generate_description),
]