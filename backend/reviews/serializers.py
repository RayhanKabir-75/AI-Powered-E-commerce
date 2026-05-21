from rest_framework import serializers
from .models import Review, ProductReviewSummary


class ReviewSerializer(serializers.ModelSerializer):
    customer_name  = serializers.SerializerMethodField()
    helpful_votes  = serializers.IntegerField(read_only=True, default=0)
    user_has_voted = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = [
            'id', 'product', 'customer', 'customer_name',
            'rating', 'comment', 'sentiment', 'created_at',
            'helpful_votes', 'user_has_voted',
        ]
        read_only_fields = ['customer', 'sentiment', 'created_at']

    def get_customer_name(self, obj):
        return obj.customer.get_full_name()

    def get_user_has_voted(self, obj):
        voted_ids = self.context.get('voted_ids', set())
        return obj.id in voted_ids

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