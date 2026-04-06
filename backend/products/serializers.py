from rest_framework import serializers
from .models import Product, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = '__all__'


class ReviewSummaryInlineSerializer(serializers.Serializer):
    """
    Lightweight summary embedded inside the product detail response.
    Gives the frontend everything it needs to show the AI summary card
    without a second API call.
    """
    summary_text   = serializers.CharField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=1)
    total_reviews  = serializers.IntegerField()
    positive_count = serializers.IntegerField()
    neutral_count  = serializers.IntegerField()
    negative_count = serializers.IntegerField()
    last_updated   = serializers.DateTimeField()


class ProductSerializer(serializers.ModelSerializer):
    avg_rating    = serializers.ReadOnlyField()
    seller_name   = serializers.CharField(source='seller.get_full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    # Embed the AI review summary directly in the product detail
    # Returns null if no summary has been generated yet
    review_summary = ReviewSummaryInlineSerializer(read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'description', 'price', 'stock', 'image',
            'category', 'category_name',
            'seller', 'seller_name',
            'avg_rating', 'review_summary',
            'created_at',
        ]
        read_only_fields = ['seller']