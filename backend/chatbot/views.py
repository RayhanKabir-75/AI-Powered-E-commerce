import os
import openai
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

openai.api_key = os.getenv('OPENAI_API_KEY')

SYSTEM_PROMPT = """You are a helpful AI shopping assistant for ShopAI, an e-commerce platform.
You help customers:
- Find and recommend products
- Track their orders
- Answer questions about products, shipping, and returns
- Provide personalised shopping advice

Always be friendly, concise, and helpful. If asked about specific order details
or account info you don't have access to, politely let the customer know."""

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    user_message = request.data.get('message', '').strip()
    history      = request.data.get('history', [])   # list of {role, content}

    if not user_message:
        return Response({'error': 'Message is required.'}, status=400)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history + \
               [{"role": "user", "content": user_message}]

    try:
        response = openai.chat.completions.create(
            model      = "gpt-3.5-turbo",
            messages   = messages,
            max_tokens = 300,
        )
        reply = response.choices[0].message.content.strip()
        return Response({'reply': reply})
    except Exception as e:
        return Response({'error': str(e)}, status=500)