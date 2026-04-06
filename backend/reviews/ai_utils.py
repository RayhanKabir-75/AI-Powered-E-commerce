"""
reviews/ai_utils.py
-------------------
All AI and NLP logic for the review system.

Two features:
  1. analyze_sentiment()  — classifies a single review comment as
                            positive / neutral / negative using NLP prompt
  2. generate_summary()   — reads ALL reviews for a product and produces
                            a human-readable paragraph summary using GenAI
"""

import os
import openai

openai.api_key = os.getenv('OPENAI_API_KEY')


def analyze_sentiment(comment: str) -> str:
    """
    NLP Feature:
    Classify a review comment as 'positive', 'neutral', or 'negative'.
    Returns one of those three strings exactly.
    Called automatically every time a review is submitted.
    """
    prompt = f"""
You are a sentiment analysis tool for an e-commerce platform.
Classify the following customer review into EXACTLY one of these three categories:
positive, neutral, negative

Reply with ONE word only — no punctuation, no explanation.

Review: "{comment}"
"""
    try:
        response = openai.chat.completions.create(
            model      = "gpt-3.5-turbo",
            messages   = [{"role": "user", "content": prompt}],
            max_tokens = 5,
            temperature= 0,   # deterministic output
        )
        result = response.choices[0].message.content.strip().lower()
        # Validate the response is one of our 3 expected values
        if result in ['positive', 'neutral', 'negative']:
            return result
        return 'neutral'   # safe fallback
    except Exception:
        return 'neutral'   # never crash on AI failure


def generate_summary(product_name: str, reviews: list[dict]) -> str:
    """
    GenAI + NLP Feature:
    Takes all reviews for a product and generates a concise, structured
    summary paragraph that helps customers make quick purchase decisions.

    reviews: list of dicts like:
        [{'rating': 5, 'comment': '...', 'sentiment': 'positive'}, ...]

    Returns a summary string.
    """
    if not reviews:
        return "No reviews yet for this product."

    # Build a readable list of reviews for the prompt
    review_lines = "\n".join([
        f"- Rating: {r['rating']}/5 | Sentiment: {r['sentiment']} | Comment: {r['comment']}"
        for r in reviews
    ])

    avg = sum(r['rating'] for r in reviews) / len(reviews)
    total = len(reviews)

    prompt = f"""
You are an AI review analyst for an e-commerce platform called ShopAI.

Product: {product_name}
Total Reviews: {total}
Average Rating: {avg:.1f}/5

Customer Reviews:
{review_lines}

Task: Write a concise 3-4 sentence summary of these reviews for potential buyers.
Your summary should:
1. Mention what customers love most
2. Mention any common complaints or concerns
3. Give an overall verdict (highly recommended / mixed / not recommended)
4. Be objective, helpful and neutral in tone

Write the summary as a single paragraph. Do not use bullet points.
"""
    try:
        response = openai.chat.completions.create(
            model      = "gpt-3.5-turbo",
            messages   = [{"role": "user", "content": prompt}],
            max_tokens = 200,
            temperature= 0.4,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Summary unavailable at this time. ({str(e)})"