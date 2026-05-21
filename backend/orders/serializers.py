from rest_framework import serializers
from .models import Order, OrderItem, PromoCode
from products.models import Product, ProductVariant


class PromoCodeSerializer(serializers.ModelSerializer):
    uses_remaining = serializers.SerializerMethodField()

    class Meta:
        model  = PromoCode
        fields = [
            'id', 'code', 'discount_percent', 'expiry',
            'max_uses', 'uses_so_far', 'uses_remaining',
            'is_active', 'created_at',
        ]

    def get_uses_remaining(self, obj):
        if obj.max_uses is None:
            return None
        return max(0, obj.max_uses - obj.uses_so_far)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source='product.name', read_only=True)
    product_emoji = serializers.SerializerMethodField()
    variant_name  = serializers.CharField(source='variant.name', default=None, read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'product_name', 'product_emoji', 'variant_name', 'quantity', 'price']

    def get_product_emoji(self, obj):
        return str(obj.product.image) if obj.product.image else ''


class OrderSerializer(serializers.ModelSerializer):
    items          = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    promo_code_used = serializers.CharField(source='promo_code.code', default=None, read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'customer_email', 'status', 'total', 'discount',
            'promo_code_used', 'items', 'created_at',
        ]
        read_only_fields = ['customer', 'total', 'discount', 'created_at']


class PlaceOrderSerializer(serializers.Serializer):
    """
    Used when a customer places a new order.
    Expects a list of cart items:
    [{ "product_id": 1, "quantity": 2, "variant_id": 3 }, ...]
    variant_id and promo_code are optional.
    """
    promo_code = serializers.CharField(required=False, allow_blank=True, default='')
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )

    def validate_items(self, items):
        validated = []
        for item in items:
            product_id = item.get('product_id')
            variant_id = item.get('variant_id')
            quantity   = int(item.get('quantity', 1))

            if not product_id:
                raise serializers.ValidationError("Each item must have a product_id.")

            try:
                product = Product.objects.get(pk=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product {product_id} not found.")

            variant = None
            if variant_id:
                try:
                    variant = ProductVariant.objects.get(pk=variant_id, product=product)
                except ProductVariant.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Variant {variant_id} not found for product '{product.name}'."
                    )
                if variant.stock < quantity:
                    raise serializers.ValidationError(
                        f"Not enough stock for '{product.name} — {variant.name}'. "
                        f"Available: {variant.stock}"
                    )
            else:
                if product.stock < quantity:
                    raise serializers.ValidationError(
                        f"Not enough stock for '{product.name}'. Available: {product.stock}"
                    )

            validated.append({
                'product':  product,
                'variant':  variant,
                'quantity': quantity,
                'price':    variant.effective_price if variant else product.price,
            })
        return validated