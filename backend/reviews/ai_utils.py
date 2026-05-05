"""
reviews/ai_utils.py
-------------------
All NLP logic for the review system — no external API keys required.

  1. analyze_sentiment()  — classifies a single review comment as
                            positive / neutral / negative using VADER (nltk)
  2. generate_summary()   — builds a human-readable paragraph summary
                            from all reviews using rule-based NLP
"""

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Download the VADER lexicon on first run (idempotent — skips if already present)
nltk.download('vader_lexicon', quiet=True)

_sia = SentimentIntensityAnalyzer()


def analyze_sentiment(comment: str) -> str:
    """
    Classify a review comment as 'positive', 'neutral', or 'negative'.
    Uses VADER compound score: >= 0.05 positive, <= -0.05 negative, else neutral.
    """
    try:
        scores = _sia.polarity_scores(comment)
        compound = scores['compound']
        if compound >= 0.10:
            return 'positive'
        elif compound <= -0.10:
            return 'negative'
        else:
            return 'neutral'
    except Exception:
        return 'neutral'


def generate_summary(product_name: str, reviews: list[dict]) -> str:
    """
    Build a 3–4 sentence summary paragraph from all reviews for a product.

    reviews: list of dicts like:
        [{'rating': 5, 'comment': '...', 'sentiment': 'positive'}, ...]
    """
    if not reviews:
        return "No reviews yet for this product."

    total = len(reviews)
    avg   = sum(r['rating'] for r in reviews) / total

    pos_reviews = [r for r in reviews if r['sentiment'] == 'positive']
    neg_reviews = [r for r in reviews if r['sentiment'] == 'negative']

    pos_pct = len(pos_reviews) / total * 100
    neg_pct = len(neg_reviews) / total * 100

    # ── Sentence 1: overall sentiment ────────────────────────────────────────
    if pos_pct >= 70:
        opening = (
            f"Customers are overwhelmingly positive about the {product_name}, "
            f"with {int(pos_pct)}% of reviewers sharing satisfied experiences."
        )
    elif pos_pct >= 50:
        opening = (
            f"The {product_name} has received mostly positive feedback, "
            f"with {int(pos_pct)}% of customers expressing satisfaction."
        )
    elif neg_pct >= 50:
        opening = (
            f"The {product_name} has received mixed to negative feedback, "
            f"with {int(neg_pct)}% of reviewers raising concerns."
        )
    else:
        opening = (
            f"Customer opinions on the {product_name} are mixed, "
            f"reflecting a range of different experiences."
        )

    # ── Sentence 2: representative positive highlight ─────────────────────────
    highlight = ""
    if pos_reviews:
        best = max(pos_reviews, key=lambda r: r['rating'])
        snippet = best['comment'][:120].rstrip()
        if len(best['comment']) > 120:
            snippet += "…"
        highlight = f' Satisfied buyers highlight: "{snippet}"'

    # ── Sentence 3: representative concern (only if negatives exist) ──────────
    concern = ""
    if neg_reviews:
        worst = min(neg_reviews, key=lambda r: r['rating'])
        snippet = worst['comment'][:100].rstrip()
        if len(worst['comment']) > 100:
            snippet += "…"
        concern = f' Some customers noted concerns such as: "{snippet}"'

    # ── Sentence 4: overall verdict ───────────────────────────────────────────
    review_word = "review" if total == 1 else "reviews"
    if avg >= 4.5:
        verdict = (
            f"Overall, with an average of {avg:.1f}/5 across {total} {review_word}, "
            f"this product is highly recommended."
        )
    elif avg >= 3.5:
        verdict = (
            f"With an average rating of {avg:.1f}/5 across {total} {review_word}, "
            f"this product is generally well regarded."
        )
    elif avg >= 2.5:
        verdict = (
            f"With an average of {avg:.1f}/5 across {total} {review_word}, "
            f"this product has received mixed reviews — consider the feedback carefully before purchasing."
        )
    else:
        verdict = (
            f"With an average of only {avg:.1f}/5 across {total} {review_word}, "
            f"most customers were not satisfied with this product."
        )

    return opening + highlight + concern + " " + verdict
