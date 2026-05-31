from rest_framework import serializers
from .models import PriceAlert


class PriceAlertSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(
        source='product.price', max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model  = PriceAlert
        fields = ['id', 'product', 'product_name', 'product_price',
                  'target_price', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
