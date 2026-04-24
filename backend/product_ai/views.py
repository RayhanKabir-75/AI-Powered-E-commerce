from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import os
import logging
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Toggle for AI usage
USE_AI = False #for Dummy Output
#USE_AI = True #for OpenAI

# Logger setup
logger = logging.getLogger(__name__)

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@api_view(['POST'])
def generate_description(request):
    try:
        #  Get input data
        product_name = request.data.get("name")
        category = request.data.get("category", "")
        features = request.data.get("features", "")

        #  Validation
        if not product_name or not category or not features:
            return Response(
                {"error": "Name, category, and features are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Generating description for: {product_name}")

        # Mock response (when AI is disabled)
        if not USE_AI:
            description = f"""
            Introducing the {product_name} – a top-quality {category} designed for modern users.
            Key Features:
            - {features}
            This product combines performance, reliability, and style, making it an excellent choice for everyday use. Perfect for customers looking for value and durability.
            """
            return Response({"description": description})

        #  AI Prompt
        prompt = f"""
        Write a professional e-commerce product description.

        Product Name: {product_name}
        Category: {category}
        Features: {features}

        Make it engaging, clear, and suitable for online shoppers.
        """

        # OpenAI API call
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )

        description = response.choices[0].message.content

        return Response({"description": description})

    except Exception as e:
        logger.error(f"Error generating description: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )