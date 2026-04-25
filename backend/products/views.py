import os
import openai
import traceback
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

openai.api_key = os.getenv('OPENAI_API_KEY')

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
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_description(request):
    """AI-powered product description generator."""
    name     = request.data.get('name', '')
    category = request.data.get('category', '')
    price    = request.data.get('price', '')
    features = request.data.get('features', '')

    prompt = f"""
    Write a compelling 2-3 sentence e-commerce product description for:
    Product: {name}
    Category: {category}
    Price: ${price}
    Key Features: {features}
    Be engaging, clear, and highlight the value to the customer.
    """
    try:
        response = openai.chat.completions.create(
            model    = "gpt-3.5-turbo",
            messages = [{"role": "user", "content": prompt}],
            max_tokens = 150,
        )
        description = response.choices[0].message.content.strip()
        return Response({'description': description})
    except Exception as e:
        return Response({'error': str(e)}, status=500)