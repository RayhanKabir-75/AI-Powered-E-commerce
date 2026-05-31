from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from products.models import Product


@receiver(pre_save, sender=Product)
def capture_old_price(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        instance._old_price = Product.objects.get(pk=instance.pk).price
    except Product.DoesNotExist:
        instance._old_price = None


@receiver(post_save, sender=Product)
def fire_price_drop_alerts(sender, instance, created, **kwargs):
    if created or not hasattr(instance, '_old_price') or instance._old_price is None:
        return
    if instance.price >= instance._old_price:
        return

    from .models import PriceAlert
    from emails import send_price_alert

    alerts = (
        PriceAlert.objects
        .filter(product=instance, target_price__gte=instance.price, is_active=True)
        .select_related('user')
    )
    for alert in alerts:
        send_price_alert(alert.user, instance, instance._old_price)
