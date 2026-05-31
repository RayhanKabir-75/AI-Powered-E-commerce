from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from products.models import Product, ProductVariant
from .models import CartItem
from .serializers import CartItemSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    items = CartItem.objects.filter(user=request.user).select_related(
        'product', 'product__category', 'variant'
    )
    return Response(CartItemSerializer(items, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_cart(request):
    """
    Replace the user's server-side cart with the supplied list.
    Payload: [{"product_id": 5, "variant_id": null, "quantity": 2}, ...]
    """
    items_data = request.data
    if not isinstance(items_data, list):
        return Response({'error': 'Expected a list.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        CartItem.objects.filter(user=request.user).delete()

        to_create = []
        for entry in items_data:
            try:
                product = Product.objects.get(pk=entry['product_id'])
            except (Product.DoesNotExist, KeyError):
                continue

            variant = None
            vid = entry.get('variant_id')
            if vid:
                try:
                    variant = ProductVariant.objects.get(pk=vid, product=product)
                except ProductVariant.DoesNotExist:
                    pass

            qty = max(1, int(entry.get('quantity', 1)))
            to_create.append(CartItem(user=request.user, product=product, variant=variant, quantity=qty))

        CartItem.objects.bulk_create(to_create, ignore_conflicts=True)

    saved = CartItem.objects.filter(user=request.user).select_related(
        'product', 'product__category', 'variant'
    )
    return Response(CartItemSerializer(saved, many=True).data)
