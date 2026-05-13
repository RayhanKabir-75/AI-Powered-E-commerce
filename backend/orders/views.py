from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ecommerce.throttles import OrderRateThrottle
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
from .models import Order, OrderItem, PromoCode
from .serializers import OrderSerializer, OrderItemSerializer, PlaceOrderSerializer, PromoCodeSerializer
from products.models import Product
from emails import send_order_confirmation, send_order_status_update

User = get_user_model()


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
@throttle_classes([OrderRateThrottle])
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
    raw_code        = serializer.validated_data.get('promo_code', '').strip().upper()

    # Validate promo code if provided
    promo    = None
    discount = 0
    if raw_code:
        try:
            promo = PromoCode.objects.get(code=raw_code)
            valid, reason = promo.is_valid
            if not valid:
                return Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)
        except PromoCode.DoesNotExist:
            return Response({'error': 'Promo code not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate subtotal then apply discount
    subtotal = sum(item['price'] * item['quantity'] for item in validated_items)
    if promo:
        discount = round(subtotal * promo.discount_percent / 100, 2)
    total = subtotal - discount

    with transaction.atomic():
        order = Order.objects.create(
            customer=request.user,
            total=total,
            discount=discount,
            promo_code=promo,
            status='pending',
        )

        for item in validated_items:
            product  = item['product']
            variant  = item['variant']
            quantity = item['quantity']

            OrderItem.objects.create(
                order    = order,
                product  = product,
                variant  = variant,
                quantity = quantity,
                price    = item['price'],
            )

            # Reduce stock from variant or product
            if variant:
                variant.stock -= quantity
                variant.save()
            else:
                product.stock -= quantity
                product.save()

    # Track promo usage outside the transaction so a rollback doesn't undo it
    if promo:
        PromoCode.objects.filter(pk=promo.pk).update(uses_so_far=F('uses_so_far') + 1)

    send_order_confirmation(order)

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

    send_order_status_update(order)

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
        for item in order.items.select_related('variant', 'product').all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save()
            else:
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

    orders = Order.objects.filter(
        items__product__seller=request.user
    ).prefetch_related('items__product').order_by('-created_at').distinct()

    result = []
    for order in orders:
        data = OrderSerializer(order).data
        # Replace items with only this seller's items
        seller_items = order.items.filter(product__seller=request.user)
        data['items'] = OrderItemSerializer(seller_items, many=True).data
        result.append(data)

    return Response(result)


# ── Admin: aggregated stats ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)

    completed = ['confirmed', 'shipped', 'delivered']

    total_revenue = Order.objects.filter(status__in=completed).aggregate(
        total=Sum('total')
    )['total'] or 0

    total_orders    = Order.objects.count()
    total_customers = User.objects.filter(role='customer').count()
    total_products  = Product.objects.count()

    # Daily revenue — last 30 days
    thirty_ago = timezone.now() - timedelta(days=30)
    daily_revenue = (
        Order.objects
        .filter(created_at__gte=thirty_ago, status__in=completed)
        .extra(select={'day': 'DATE(created_at)'})
        .values('day')
        .annotate(revenue=Sum('total'), orders=Count('id'))
        .order_by('day')
    )

    # Order status breakdown
    status_breakdown = Order.objects.values('status').annotate(count=Count('id'))

    # Top 10 products by revenue
    top_products = (
        OrderItem.objects
        .values('product__name')
        .annotate(
            units_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('price')),
        )
        .order_by('-revenue')[:10]
    )

    # Revenue by category
    category_revenue = (
        OrderItem.objects
        .values('product__category__name')
        .annotate(revenue=Sum(F('quantity') * F('price')), units=Sum('quantity'))
        .order_by('-revenue')
    )

    recent_orders = Order.objects.prefetch_related('items__product').order_by('-created_at')[:20]

    return Response({
        'kpis': {
            'total_revenue':   float(total_revenue),
            'total_orders':    total_orders,
            'total_customers': total_customers,
            'total_products':  total_products,
        },
        'daily_revenue': [
            {'day': str(r['day']), 'revenue': float(r['revenue']), 'orders': r['orders']}
            for r in daily_revenue
        ],
        'status_breakdown': [
            {'status': r['status'], 'count': r['count']}
            for r in status_breakdown
        ],
        'top_products': [
            {
                'name':       r['product__name'],
                'units_sold': r['units_sold'],
                'revenue':    float(r['revenue']),
            }
            for r in top_products
        ],
        'category_revenue': [
            {
                'category': r['product__category__name'] or 'Uncategorized',
                'revenue':  float(r['revenue']),
                'units':    r['units'],
            }
            for r in category_revenue
        ],
        'recent_orders': OrderSerializer(recent_orders, many=True).data,
    })


# ── Admin: all orders with optional status filter ─────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_all_orders(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)

    qs = Order.objects.prefetch_related('items__product').order_by('-created_at')
    status_filter = request.GET.get('status', '')
    if status_filter:
        qs = qs.filter(status=status_filter)

    return Response(OrderSerializer(qs, many=True).data)


# ── Validate a promo code (any authenticated user) ────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_promo(request):
    """
    POST /api/orders/validate-promo/
    Body: { "code": "SUMMER10" }
    Returns: { "valid": true, "discount_percent": 10, "message": "10% off!" }
    """
    code = request.data.get('code', '').strip().upper()
    if not code:
        return Response({'valid': False, 'error': 'No code provided.'}, status=400)

    try:
        promo = PromoCode.objects.get(code=code)
    except PromoCode.DoesNotExist:
        return Response({'valid': False, 'error': 'Invalid promo code.'})

    valid, reason = promo.is_valid
    if not valid:
        return Response({'valid': False, 'error': reason})

    return Response({
        'valid':            True,
        'code':             promo.code,
        'discount_percent': promo.discount_percent,
        'message':          f'{promo.discount_percent}% off your order!',
    })


# ── Admin: promo code management ──────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_promos(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)

    if request.method == 'GET':
        promos = PromoCode.objects.order_by('-created_at')
        return Response(PromoCodeSerializer(promos, many=True).data)

    # POST — create new promo
    code = request.data.get('code', '').strip().upper()
    if not code:
        return Response({'error': 'Code is required.'}, status=400)

    data = {**request.data, 'code': code}
    serializer = PromoCodeSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data, status=201)


@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_promo_detail(request, promo_id):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)

    try:
        promo = PromoCode.objects.get(pk=promo_id)
    except PromoCode.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)

    if request.method == 'DELETE':
        promo.delete()
        return Response(status=204)

    # PATCH — toggle active
    promo.is_active = not promo.is_active
    promo.save()
    return Response(PromoCodeSerializer(promo).data)
