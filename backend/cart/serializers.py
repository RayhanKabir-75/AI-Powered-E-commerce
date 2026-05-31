from rest_framework import serializers
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_id    = serializers.IntegerField(source='product.id', read_only=True)
    variant_id    = serializers.IntegerField(source='variant.id', read_only=True, allow_null=True)
    product_name  = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    category_name = serializers.SerializerMethodField()
    variant_name  = serializers.SerializerMethodField()
    price         = serializers.SerializerMethodField()

    class Meta:
        model  = CartItem
        fields = [
            'id', 'product_id', 'variant_id', 'quantity',
            'product_name', 'product_image', 'category_name',
            'variant_name', 'price',
        ]

    def get_category_name(self, obj):
        return obj.product.category.name if obj.product.category else ''

    def get_variant_name(self, obj):
        return obj.variant.name if obj.variant else None

    def get_price(self, obj):
        if obj.variant and obj.variant.price is not None:
            return str(obj.variant.price)
        return str(obj.product.price)
