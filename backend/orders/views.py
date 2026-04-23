from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer, PlaceOrderSerializer


# ── List customer's own orders ────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_orders(request):
    """
    GET /api/orders/
    Returns all orders for the currently logged-in customer,
    newest first, with full item details.
    """
    orders = Order.objects.filter(
        customer=request.user
    ).prefetch_related('items__product').order_by('-created_at')

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


# ── Get single order detail ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """
    GET /api/orders/<order_id>/
    Returns full details of one order.
    Customer can only see their own orders.
    Sellers and admins can see any order.
    """
    try:
        order = Order.objects.prefetch_related('items__product').get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found.'}, status=404)

    user = request.user
    # Permission: customer can only see their own orders
    if user.role == 'customer' and order.customer != user:
        return Response({'error': 'Permission denied.'}, status=403)

    return Response(OrderSerializer(order).data)


# ── Place a new order ─────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    """
    POST /api/orders/place/
    Body: { "items": [{ "product_id": 1, "quantity": 2 }, ...] }

    Creates a new order and reduces stock for each product.
    Uses a database transaction so if anything fails, nothing is saved.
    """
    if request.user.role != 'customer':
        return Response({'error': 'Only customers can place orders.'}, status=403)

    serializer = PlaceOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    validated_items = serializer.validated_data['items']

    # Calculate total
    total = sum(item['product'].price * item['quantity'] for item in validated_items)

    # Use a transaction — if any step fails, everything rolls back
    with transaction.atomic():
        order = Order.objects.create(
            customer=request.user,
            total=total,
            status='pending',
        )

        for item in validated_items:
            product  = item['product']
            quantity = item['quantity']

            OrderItem.objects.create(
                order    = order,
                product  = product,
                quantity = quantity,
                price    = product.price,
            )

            # Reduce stock
            product.stock -= quantity
            product.save()

    return Response(
        OrderSerializer(order).data,
        status=status.HTTP_201_CREATED
    )


# ── Update order status (seller / admin only) ─────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """
    PATCH /api/orders/<order_id>/status/
    Body: { "status": "shipped" }

    Sellers can update orders that contain their products.
    Admins can update any order.
    """
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found.'}, status=404)

    user       = request.user
    new_status = request.data.get('status', '').strip()

    # Validate role
    if user.role == 'customer':
        return Response({'error': 'Customers cannot update order status.'}, status=403)

    # Validate status value
    valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response(
            {'error': f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
            status=400
        )

    order.status = new_status
    order.save()

    return Response(OrderSerializer(order).data)


# ── Cancel an order (customer only, only if pending) ─────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """
    POST /api/orders/<order_id>/cancel/
    Customers can cancel their own order only if it is still 'pending'.
    Stock is restored on cancellation.
    """
    try:
        order = Order.objects.prefetch_related('items__product').get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found.'}, status=404)

    if order.customer != request.user:
        return Response({'error': 'You can only cancel your own orders.'}, status=403)

    if order.status != 'pending':
        return Response(
            {'error': f"Cannot cancel an order that is already '{order.status}'."},
            status=400
        )

    with transaction.atomic():
        # Restore stock for each item
        for item in order.items.all():
            item.product.stock += item.quantity
            item.product.save()

        order.status = 'cancelled'
        order.save()

    return Response({'message': 'Order cancelled successfully.', 'order': OrderSerializer(order).data})


# ── List orders containing seller's products ──────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_orders(request):
    """
    GET /api/orders/seller/
    Returns all orders that contain at least one product belonging to the seller.
    """
    if request.user.role != 'seller':
        return Response({'error': 'Only sellers can access this endpoint.'}, status=403)

    # Find orders that have items belonging to this seller's products
    orders = Order.objects.filter(
        items__product__seller=request.user
    ).prefetch_related('items__product').order_by('-created_at').distinct()

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)