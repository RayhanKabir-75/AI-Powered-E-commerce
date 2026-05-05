from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Count, F
from django.utils import timezone
from datetime import timedelta
from .models import Product, Category, BrowsingHistory
from .serializers import ProductSerializer, CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs       = Product.objects.all()
        keyword  = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        min_p    = self.request.query_params.get('min_price')
        max_p    = self.request.query_params.get('max_price')
        if keyword:  qs = qs.filter(name__icontains=keyword)
        if category: qs = qs.filter(category__name__icontains=category)
        if min_p:    qs = qs.filter(price__gte=min_p)
        if max_p:    qs = qs.filter(price__lte=max_p)
        # Sellers only see their own products
        if self.request.user.is_authenticated and self.request.user.role == 'seller':
            qs = qs.filter(seller=self.request.user)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        if self.request.user.role != 'seller':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only sellers can create products.")
        serializer.save(seller=self.request.user)

    def perform_update(self, serializer):
        # Only the seller who owns the product can update it
        if self.get_object().seller != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own products.")
        serializer.save()

    def perform_destroy(self, instance):
        # Only the seller who owns the product can delete it
        if instance.seller != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own products.")
        instance.delete()

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# ── Track a product view ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_view(request, product_id):
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    record, created = BrowsingHistory.objects.get_or_create(
        user=request.user, product=product
    )
    if not created:
        BrowsingHistory.objects.filter(pk=record.pk).update(
            view_count=F('view_count') + 1
        )
    return Response({'status': 'tracked'})


# ── Get personalised recommendations ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommendations(request):
    user  = request.user
    limit = int(request.GET.get('limit', 8))

    # Categories the user has browsed recently (last 60 days)
    browsed_cats = set(
        BrowsingHistory.objects
        .filter(user=user, last_viewed__gte=timezone.now() - timedelta(days=60))
        .values_list('product__category_id', flat=True)
    )

    # Categories the user has purchased from
    from orders.models import OrderItem
    purchased_cats = set(
        OrderItem.objects
        .filter(order__customer=user)
        .values_list('product__category_id', flat=True)
    )

    # Products the user has already purchased (exclude from recs)
    purchased_ids = set(
        OrderItem.objects
        .filter(order__customer=user)
        .values_list('product_id', flat=True)
    )

    preferred_cats = (browsed_cats | purchased_cats) - {None}

    base_qs = Product.objects.filter(stock__gt=0).exclude(id__in=purchased_ids)

    if preferred_cats:
        # Primary: products from preferred categories, ranked by popularity
        primary = list(
            base_qs.filter(category_id__in=preferred_cats)
            .annotate(popularity=Count('views') + Count('orderitem'))
            .order_by('-popularity')
            .select_related('category', 'seller')[:limit]
        )

        # Fill remaining slots with overall bestsellers
        if len(primary) < limit:
            seen = {p.id for p in primary} | purchased_ids
            extras = list(
                base_qs.exclude(id__in=seen)
                .annotate(popularity=Count('orderitem'))
                .order_by('-popularity')
                .select_related('category', 'seller')[:limit - len(primary)]
            )
            primary += extras

        result = primary
    else:
        # No history yet — show bestsellers
        result = list(
            base_qs
            .annotate(popularity=Count('orderitem'))
            .order_by('-popularity')
            .select_related('category', 'seller')[:limit]
        )

    return Response(ProductSerializer(result, many=True).data)

