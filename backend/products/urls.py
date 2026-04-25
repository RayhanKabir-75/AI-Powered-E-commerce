from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from product_ai import views as product_ai_views

router = DefaultRouter()
router.register('', views.ProductViewSet, basename='product')
router.register('categories', views.CategoryViewSet, basename='category')

urlpatterns = [
    path('generate-description/', product_ai_views.generate_description),
    path('', include(router.urls)),
]