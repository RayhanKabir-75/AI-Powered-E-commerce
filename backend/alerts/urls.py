from django.urls import path
from . import views

urlpatterns = [
    path('',                    views.alert_list_create),
    path('<int:product_id>/',   views.alert_delete),
]
