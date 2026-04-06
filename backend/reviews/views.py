"""
reviews/views.py
----------------
Endpoints:

  GET  /api/reviews/?product=<id>     — list all reviews for a product
  POST /api/reviews/                  — submit a review (authenticated customers)
  GET  /api/reviews/summary/<id>/     — get the AI-generated summary for a product
  POST /api/reviews/summary/<id>/regenerate/  — force-regenerate summary (admin/seller)
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Review, ProductReviewSummary
from .serializers import ReviewSerializer, ProductReviewSummarySerializer
from .ai_utils import analyze_sentiment, generate_summary
from products.models import Product


def _rebuild_summary(product: Product):
    """
    Internal helper — called after every new review is saved.
    Pulls all reviews, recalculates counts and average,
    calls GenAI to regenerate the summary paragraph,
    and saves/updates the ProductReviewSummary record.
    """
    reviews_qs = product.reviews.all()
    if not reviews_qs.exists():
        return

    # Build list for the AI prompt
    review_data = list(reviews_qs.values('rating', 'comment', 'sentiment'))

    # Recalculate stats
    total    = reviews_qs.count()
    avg      = sum(r['rating'] for r in review_data) / total
    pos      = reviews_qs.filter(sentiment='positive').count()
    neu      = reviews_qs.filter(sentiment='neutral').count()
    neg      = reviews_qs.filter(sentiment='negative').count()

    # Generate new summary via GenAI
    summary_text = generate_summary(product.name, review_data)

    # Save or update the summary record
    ProductReviewSummary.objects.update_or_create(
        product=product,
        defaults={
            'summary_text':   summary_text,
            'positive_count': pos,
            'neutral_count':  neu,
            'negative_count': neg,
            'average_rating': round(avg, 1),
            'total_reviews':  total,
        }
    )


# ── List reviews for a product ────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def list_reviews(request):
    """
    GET /api/reviews/?product=<product_id>
    Returns all reviews for a given product, ordered newest first.
    """
    product_id = request.query_params.get('product')
    if not product_id:
        return Response({'error': 'product query parameter is required.'}, status=400)

    reviews = Review.objects.filter(product_id=product_id).order_by('-created_at')
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)


# ── Submit a review ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_review(request):
    """
    POST /api/reviews/
    Body: { "product": <id>, "rating": 1-5, "comment": "..." }

    Steps performed automatically:
      1. Validate the review data
      2. Run NLP sentiment analysis on the comment → sets sentiment field
      3. Save the review
      4. Regenerate the AI summary for the product (all reviews combined)
    """
    serializer = ReviewSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Check this customer hasn't already reviewed this product
    product_id = request.data.get('product')
    if Review.objects.filter(product_id=product_id, customer=request.user).exists():
        return Response(
            {'error': 'You have already reviewed this product.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Step 2: NLP sentiment analysis ──────────────────────────────────────
    comment   = serializer.validated_data['comment']
    sentiment = analyze_sentiment(comment)   # → 'positive', 'neutral', or 'negative'

    # ── Step 3: Save the review ──────────────────────────────────────────────
    review = serializer.save(customer=request.user, sentiment=sentiment)

    # ── Step 4: Regenerate AI summary for this product ───────────────────────
    _rebuild_summary(review.product)

    return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


# ── Get the AI summary for a product ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def get_summary(request, product_id):
    """
    GET /api/reviews/summary/<product_id>/
    Returns the AI-generated summary + sentiment breakdown for a product.
    """
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    try:
        summary = product.review_summary
        return Response(ProductReviewSummarySerializer(summary).data)
    except ProductReviewSummary.DoesNotExist:
        # No summary yet — generate one on the fly if there are reviews
        reviews_qs = product.reviews.all()
        if not reviews_qs.exists():
            return Response({'message': 'No reviews yet for this product.'})
        _rebuild_summary(product)
        return Response(ProductReviewSummarySerializer(product.review_summary).data)


# ── Force-regenerate summary (admin / seller only) ────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_summary(request, product_id):
    """
    POST /api/reviews/summary/<product_id>/regenerate/
    Forces the AI to reread all reviews and produce a fresh summary.
    Useful after bulk review imports or moderation changes.
    Only accessible to admin or the product's seller.
    """
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    # Permission check — only admin or the seller of this product
    user = request.user
    if user.role not in ['admin'] and product.seller != user:
        return Response({'error': 'Permission denied.'}, status=403)

    reviews_qs = product.reviews.all()
    if not reviews_qs.exists():
        return Response({'message': 'No reviews to summarise yet.'})

    _rebuild_summary(product)
    return Response({
        'message': 'Summary regenerated successfully.',
        **ProductReviewSummarySerializer(product.review_summary).data
    })