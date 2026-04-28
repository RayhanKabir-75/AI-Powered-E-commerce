from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import os
import logging
from dotenv import load_dotenv
from openai import OpenAI
import traceback


# Load environment variables
load_dotenv()

# Logger
logger = logging.getLogger(__name__)

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_description(request):
    """AI-powered product description generator."""
    # Toggle AI usage
    USE_AI = True  # Change to False to force mock response during development
    name     = request.data.get('name', '')
    category = request.data.get('category', '')
    price    = request.data.get('price', '')
    features = request.data.get('features', '')

    def build_mock_description():
        return f"""
Introducing the {name} – a premium {category} available for just ${price}.

Key Features:
- {features}

This product delivers outstanding performance, durability, and value for money, making it a perfect choice for modern customers.
"""

    logger.info(f"Generating description for product: {name}, category: {category}, price: {price}")

    if not USE_AI:
        description = build_mock_description()
        logger.info("USE_AI is False; returning mock response instead of calling OpenAI API")
        return Response({
            'message': 'Mock response generated because OpenAI API usage is disabled.',
            'description': description
        })

    prompt = f"""
    Write a compelling 2-3 sentence e-commerce product description for:
    Product: {name}
    Category: {category}
    Price: ${price}
    Key Features: {features}
    Be engaging, clear, and highlight the value to the customer.
    """
    try:
        response = client.chat.completions.create(
            model    = "gpt-3.5-turbo",
            messages = [{"role": "user", "content": prompt}],
            max_tokens = 150,
        )
        description = response.choices[0].message.content.strip()
        logger.info(f"Successfully generated description for {name}")
        return Response({'description': description})
    except Exception:
        logger.exception(f"OpenAI API call failed for product: {name}")
        description = build_mock_description()
        return Response({
            'message': 'OpenAI API failed; mock response generated instead.',
            'description': description
        })