from django.urls import path
from . import views

urlpatterns = [
    # List all reviews for a product:  GET /api/reviews/?product=<id>
    path('',                                    views.list_reviews),

    # Submit a new review:             POST /api/reviews/submit/
    path('submit/',                             views.submit_review),

    # Get AI summary for a product:    GET /api/reviews/summary/<product_id>/
    path('summary/<int:product_id>/',           views.get_summary),

    # Force-regenerate summary:        POST /api/reviews/summary/<id>/regenerate/
    path('summary/<int:product_id>/regenerate/', views.regenerate_summary),
]