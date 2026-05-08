from django.urls import path
from . import views

urlpatterns = [
    path('',                                      views.list_reviews),
    path('submit/',                               views.submit_review),
    path('summary/<int:product_id>/',             views.get_summary),
    path('summary/<int:product_id>/regenerate/',  views.regenerate_summary),
    path('<int:review_id>/vote/',                 views.vote_review),
]