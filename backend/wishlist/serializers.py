from rest_framework import serializers
from products.models import Product
from .models import WishlistItem


class WishlistProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', default=None)
    avg_rating    = serializers.FloatField(read_only=True)

    class Meta:
        model  = Product
        fields = ['id', 'name', 'price', 'image', 'stock', 'category_name', 'avg_rating']


class WishlistItemSerializer(serializers.ModelSerializer):
    product    = WishlistProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = WishlistItem
        fields = ['id', 'product', 'product_id', 'created_at']
