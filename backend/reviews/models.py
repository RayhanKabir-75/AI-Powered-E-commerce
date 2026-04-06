from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from products.models import Product


class Review(models.Model):
    """
    A customer review for a product.
    - sentiment : auto-filled by NLP when review is submitted
    - summary   : AI-generated summary stored on the Product (see ProductReviewSummary)
    """
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral',  'Neutral'),
        ('negative', 'Negative'),
    ]

    product   = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        to_field='email',
    )
    rating    = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment   = models.TextField()
    sentiment = models.CharField(
        max_length=10, choices=SENTIMENT_CHOICES, blank=True
    )  # auto-filled by NLP on save
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'customer')  # one review per product per user

    def __str__(self):
        return f"{self.customer_id} → {self.product.name} ({self.rating}★)"


class ProductReviewSummary(models.Model):
    """
    Stores the AI-generated NLP summary for a product's reviews.
    Regenerated whenever a new review is submitted.
    One-to-one with Product.
    """
    product            = models.OneToOneField(
        Product, on_delete=models.CASCADE, related_name='review_summary'
    )
    summary_text       = models.TextField()          # AI-generated paragraph
    positive_count     = models.IntegerField(default=0)
    neutral_count      = models.IntegerField(default=0)
    negative_count     = models.IntegerField(default=0)
    average_rating     = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    total_reviews      = models.IntegerField(default=0)
    last_updated       = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Summary for {self.product.name}"