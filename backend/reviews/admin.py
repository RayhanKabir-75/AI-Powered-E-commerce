from django.contrib import admin
from .models import Review, ProductReviewSummary


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display   = ('id', 'product', 'customer', 'rating', 'sentiment', 'created_at')
    list_filter    = ('sentiment', 'rating')
    search_fields  = ('product__name', 'customer__email', 'comment')
    ordering       = ('-created_at',)
    readonly_fields = ('sentiment', 'created_at')


@admin.register(ProductReviewSummary)
class ProductReviewSummaryAdmin(admin.ModelAdmin):
    list_display   = ('product', 'average_rating', 'total_reviews',
                      'positive_count', 'neutral_count', 'negative_count', 'last_updated')
    search_fields  = ('product__name',)
    readonly_fields = ('last_updated',)