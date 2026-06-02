from django.urls import path
from .consumers import OrderTrackingConsumer

websocket_urlpatterns = [
    path('ws/orders/', OrderTrackingConsumer.as_asgi()),
]
