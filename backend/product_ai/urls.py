from django.urls import path
from .views import generate_description

urlpatterns = [
    path('ai/generate-description/', generate_description),
]