from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from products.models import Product, ProductVariant


class PromoCode(models.Model):
    code             = models.CharField(max_length=20, unique=True)
    discount_percent = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    expiry      = models.DateField(null=True, blank=True)
    max_uses    = models.IntegerField(null=True, blank=True)
    uses_so_far = models.IntegerField(default=0)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} — {self.discount_percent}% off"

    @property
    def is_valid(self):
        if not self.is_active:
            return False, "This promo code is no longer active."
        if self.expiry and self.expiry < timezone.now().date():
            return False, "This promo code has expired."
        if self.max_uses is not None and self.uses_so_far >= self.max_uses:
            return False, "This promo code has reached its usage limit."
        return True, None


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped',   'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        to_field='email',
    )
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code = models.ForeignKey(
        PromoCode, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} — {self.customer_id} ({self.status})"


class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant  = models.ForeignKey(
        ProductVariant, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='order_items',
    )
    quantity = models.PositiveIntegerField(default=1)
    price    = models.DecimalField(max_digits=10, decimal_places=2)

    def subtotal(self):
        return self.price * self.quantity