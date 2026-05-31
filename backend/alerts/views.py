from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ecommerce.pagination import StandardPagination
from products.models import Product
from .models import PriceAlert
from .serializers import PriceAlertSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def alert_list_create(request):
    if request.method == 'GET':
        alerts = (
            PriceAlert.objects
            .filter(user=request.user, is_active=True)
            .select_related('product')
            .order_by('-created_at')
        )
        paginator = StandardPagination()
        page = paginator.paginate_queryset(alerts, request)
        return paginator.get_paginated_response(PriceAlertSerializer(page, many=True).data)

    # POST — upsert alert for a product
    product_id   = request.data.get('product')
    target_price = request.data.get('target_price')

    if not product_id or target_price is None:
        return Response({'error': 'product and target_price are required.'}, status=400)

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    try:
        target_price = float(target_price)
        if target_price <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'error': 'target_price must be a positive number.'}, status=400)

    alert, created = PriceAlert.objects.update_or_create(
        user=request.user,
        product=product,
        defaults={'target_price': target_price, 'is_active': True},
    )
    return Response(PriceAlertSerializer(alert).data, status=201 if created else 200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def alert_delete(request, product_id):
    try:
        alert = PriceAlert.objects.get(user=request.user, product_id=product_id)
    except PriceAlert.DoesNotExist:
        return Response({'error': 'Alert not found.'}, status=404)
    alert.delete()
    return Response(status=204)
