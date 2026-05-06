from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from products.models import Product
from .models import WishlistItem
from .serializers import WishlistItemSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_wishlist(request):
    """GET /api/wishlist/ — return all saved items for the current user."""
    items = WishlistItem.objects.filter(user=request.user).select_related('product__category').order_by('-created_at')
    return Response(WishlistItemSerializer(items, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_wishlist(request):
    """
    POST /api/wishlist/toggle/
    Body: { "product_id": <int> }
    Adds the product if not saved; removes it if already saved.
    Returns: { "added": bool, "product_id": int }
    """
    product_id = request.data.get('product_id')
    if not product_id:
        return Response({'error': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
    if not created:
        item.delete()
        return Response({'added': False, 'product_id': product_id})

    return Response({'added': True, 'product_id': product_id}, status=status.HTTP_201_CREATED)
