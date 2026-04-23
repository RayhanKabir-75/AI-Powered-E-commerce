from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source='product.name',  read_only=True)
    product_emoji = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'product_name', 'product_emoji', 'quantity', 'price']

    def get_product_emoji(self, obj):
        # Return the product image URL if it exists, otherwise empty string
        return str(obj.product.image) if obj.product.image else ''


class OrderSerializer(serializers.ModelSerializer):
    items        = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'customer_email', 'status', 'total',
            'items', 'created_at'
        ]
        read_only_fields = ['customer', 'total', 'created_at']


class PlaceOrderSerializer(serializers.Serializer):
    """
    Used when a customer places a new order.
    Expects a list of cart items:
    [{ "product_id": 1, "quantity": 2 }, ...]
    """
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )

    def validate_items(self, items):
        validated = []
        for item in items:
            product_id = item.get('product_id')
            quantity   = item.get('quantity', 1)

            if not product_id:
                raise serializers.ValidationError("Each item must have a product_id.")

            try:
                product = Product.objects.get(pk=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product {product_id} not found.")

            if product.stock < quantity:
                raise serializers.ValidationError(
                    f"Not enough stock for '{product.name}'. Available: {product.stock}"
                )

            validated.append({'product': product, 'quantity': int(quantity)})
        return validated