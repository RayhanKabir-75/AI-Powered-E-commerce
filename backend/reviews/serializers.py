from rest_framework import serializers
from .models import Review, ProductReviewSummary


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = [
            'id', 'product', 'customer', 'customer_name',
            'rating', 'comment', 'sentiment', 'created_at'
        ]
        read_only_fields = ['customer', 'sentiment', 'created_at']
        # sentiment is read-only because it is auto-set by NLP on submit

    def get_customer_name(self, obj):
        return obj.customer.get_full_name()

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ProductReviewSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductReviewSummary
        fields = [
            'summary_text',
            'positive_count', 'neutral_count', 'negative_count',
            'average_rating', 'total_reviews', 'last_updated',
        ]