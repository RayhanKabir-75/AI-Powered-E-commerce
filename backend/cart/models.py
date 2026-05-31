from django.db import models
from django.conf import settings


class CartItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart_items',
        to_field='email',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='cart_items',
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cart_items',
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('user', 'product', 'variant')

    def __str__(self):
        return f"{self.user_id} — {self.product.name} x{self.quantity}"
