from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.ProductViewSet, basename='product')

# Categories has its own router so it doesn't get swallowed by the empty router
categories_router = DefaultRouter()
categories_router.register('', views.CategoryViewSet, basename='category')

urlpatterns = [
    path('generate-description/', views.generate_description),
    path('categories/', include(categories_router.urls)),
    path('', include(router.urls)),
]