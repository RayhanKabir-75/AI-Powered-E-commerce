from django.db import models
from django.conf import settings


class PriceAlert(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='price_alerts',
        to_field='email',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='price_alerts',
    )
    target_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'product']

    def __str__(self):
        return f"{self.user_id} alert on {self.product_id} @ ${self.target_price}"
