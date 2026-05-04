from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import logging
import requests

logger = logging.getLogger(__name__)

OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"  # change to any model you have pulled locally


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_description(request):
    """Generate a product description using a local Ollama model."""
    name     = request.data.get('name', '').strip()
    category = request.data.get('category', '').strip()
    price    = request.data.get('price', '').strip()
    features = request.data.get('features', '').strip()

    prompt = (
        f"Write a compelling 2-3 sentence e-commerce product description.\n"
        f"Product: {name}\n"
        f"Category: {category}\n"
        f"Price: ${price}\n"
        f"Key features: {features}\n"
        f"Be concise, engaging, and highlight the value to the customer. "
        f"Return only the description, no headings or bullet points."
    )

    try:
        resp = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=60,
        )
        resp.raise_for_status()
        description = resp.json().get("response", "").strip()
        logger.info("Ollama generated description for: %s", name)
        return Response({"description": description})

    except requests.exceptions.ConnectionError:
        logger.warning("Ollama not running — falling back to template")
        description = _template_description(name, category, price, features)
        return Response({
            "message": "Ollama is not running. Start it with: ollama serve",
            "description": description,
        })

    except Exception as exc:
        logger.exception("Ollama request failed: %s", exc)
        description = _template_description(name, category, price, features)
        return Response({
            "message": "AI generation failed — template used instead.",
            "description": description,
        })


def _template_description(name, category, price, features):
    return (
        f"Introducing the {name} — a premium {category} available for just ${price}. "
        f"Featuring {features}, it delivers outstanding performance and value. "
        f"A perfect choice for modern customers who expect quality."
    )