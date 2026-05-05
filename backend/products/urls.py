from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from product_ai import views as product_ai_views

router = DefaultRouter()
router.register('', views.ProductViewSet, basename='product')

urlpatterns = [
    path('generate-description/',           product_ai_views.generate_description),
    path('categories/',                     views.CategoryViewSet.as_view({'get': 'list'})),
    path('recommended/',                    views.recommendations),
    path('<int:product_id>/view/',          views.track_view),
    path('', include(router.urls)),
]