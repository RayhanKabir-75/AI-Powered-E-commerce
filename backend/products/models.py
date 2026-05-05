from django.db import models
from django.conf import settings


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    # ForeignKey references settings.AUTH_USER_MODEL (not User directly)
    # This is the correct pattern whenever AUTH_USER_MODEL is customised.
    seller   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        to_field='email',          # ← explicitly point to our PK field
    )
    category    = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)   # AI-generated
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    stock       = models.IntegerField(default=0)
    image       = models.ImageField(upload_to='products/', blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def avg_rating(self):
        reviews = self.reviews.all()
        if not reviews:
            return 0
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)


class BrowsingHistory(models.Model):
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='browsing_history',
        to_field='email',
    )
    product     = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='views')
    view_count  = models.PositiveIntegerField(default=1)
    last_viewed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'product']

    def __str__(self):
        return f"{self.user_id} viewed {self.product.name} ({self.view_count}x)"