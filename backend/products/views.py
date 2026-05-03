from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Product, Category
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

