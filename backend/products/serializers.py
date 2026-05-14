from rest_framework import serializers
from .models import Product, Category, ProductVariant, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ['id', 'image', 'order']


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.ReadOnlyField()

    class Meta:
        model  = ProductVariant
        fields = ['id', 'name', 'price', 'effective_price', 'stock']


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
    review_summary = ReviewSummaryInlineSerializer(read_only=True)
    variants       = ProductVariantSerializer(many=True, read_only=True)
    has_variants   = serializers.SerializerMethodField()
    gallery        = ProductImageSerializer(many=True, read_only=True)

    def get_has_variants(self, obj):
        return obj.variants.exists()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'description', 'price', 'stock', 'image',
            'category', 'category_name',
            'seller', 'seller_name',
            'avg_rating', 'review_summary',
            'variants', 'has_variants',
            'gallery',
            'created_at',
        ]
        read_only_fields = ['seller']