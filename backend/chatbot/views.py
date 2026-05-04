import requests
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from orders.models import Order
from products.models import Product
from django.db.models import Sum, F

logger = logging.getLogger(__name__)

OLLAMA_URL   = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "llama3.2"


def _build_system_prompt(user):
    """Build a system prompt that includes the user's real orders and live product data."""

    # ── User's last 5 orders ──────────────────────────────────────────────────
    orders = (
        Order.objects
        .filter(customer=user)
        .prefetch_related('items__product')
        .order_by('-created_at')[:5]
    )
    if orders:
        order_lines = []
        for o in orders:
            items_str = ', '.join(
                f"{it.product.name} x{it.quantity}" for it in o.items.all()
            )
            order_lines.append(
                f"  Order #{o.id} | Status: {o.status} | Total: ${o.total} | Items: {items_str} | Date: {o.created_at.strftime('%d %b %Y')}"
            )
        orders_context = "Customer's recent orders:\n" + "\n".join(order_lines)
    else:
        orders_context = "Customer has no orders yet."

    # ── Best sellers (top 8 by units sold) ───────────────────────────────────
    best_sellers = (
        Product.objects
        .annotate(total_sold=Sum('orderitem__quantity'))
        .filter(total_sold__isnull=False)
        .order_by('-total_sold')[:8]
    )
    if best_sellers:
        bs_lines = [
            f"  - {p.name} (${p.price}, {p.total_sold} sold, stock: {p.stock})"
            for p in best_sellers
        ]
        sellers_context = "Best-selling products:\n" + "\n".join(bs_lines)
    else:
        # Fall back to any available products
        products = Product.objects.filter(stock__gt=0)[:8]
        bs_lines = [f"  - {p.name} (${p.price})" for p in products]
        sellers_context = "Available products:\n" + "\n".join(bs_lines) if bs_lines else "No products listed yet."

    # ── All in-stock products (name, category, price, stock) ─────────────────
    all_products = Product.objects.filter(stock__gt=0).select_related('category')[:40]
    prod_lines = [
        f"  - {p.name} | Category: {p.category.name if p.category else 'N/A'} | ${p.price} | Stock: {p.stock}"
        for p in all_products
    ]
    products_context = "All available products:\n" + "\n".join(prod_lines) if prod_lines else "No products available."

    return f"""You are a helpful AI shopping assistant for ShopAI, an e-commerce platform.
You have access to live data about this customer and the store. Use it to answer questions accurately.

{orders_context}

{sellers_context}

{products_context}

Instructions:
- To track an order, look up the customer's orders listed above and report the status.
- To recommend products, use the best sellers or search the product list above.
- To find a product by name or category, search the product list above.
- Keep responses short and friendly — 2 to 4 sentences maximum.
- If the customer asks about something not in the data above, politely say you don't have that information.
- Never make up order statuses, prices, or product names.
"""


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    user_message = request.data.get('message', '').strip()
    history      = request.data.get('history', [])

    if not user_message:
        return Response({'error': 'Message is required.'}, status=400)

    system_prompt = _build_system_prompt(request.user)

    messages = (
        [{"role": "system", "content": system_prompt}]
        + [{"role": m["role"], "content": m["content"]} for m in history if m["role"] != "system"]
        + [{"role": "user", "content": user_message}]
    )

    try:
        resp = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
            timeout=60,
        )
        resp.raise_for_status()
        reply = resp.json()["message"]["content"].strip()
        logger.info("Chatbot reply for user %s", request.user.email)
        return Response({"reply": reply})

    except requests.exceptions.ConnectionError:
        logger.warning("Ollama not running for chatbot")
        return Response({
            "reply": "I'm offline right now. Please make sure Ollama is running (`ollama serve`) and try again."
        })

    except Exception as exc:
        logger.exception("Chatbot request failed: %s", exc)
        return Response({
            "reply": "Something went wrong on my end. Please try again in a moment."
        })
