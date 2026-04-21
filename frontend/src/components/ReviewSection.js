import React, { useState, useEffect } from 'react';
import { getReviews, submitReview, getReviewSummary } from '../api/api';

const SENTIMENT_STYLE = {
  positive: { bg: 'rgba(39,174,96,0.1)',   color: '#27AE60', label: '😊 Positive' },
  neutral:  { bg: 'rgba(201,149,42,0.1)',  color: '#C9952A', label: '😐 Neutral'  },
  negative: { bg: 'rgba(192,57,43,0.1)',   color: '#C0392B', label: '😞 Negative' },
};

// ── Star rating input ────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star}
          style={{ fontSize: 24, cursor: 'pointer', color: star <= (hovered || value) ? '#C9952A' : '#D0D5DD', transition: 'color 0.15s' }}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── AI Summary Card ──────────────────────────────────────────────────────────
function AISummaryCard({ summary }) {
  if (!summary) return null;
  const total = summary.positive_count + summary.neutral_count + summary.negative_count;
  const pct   = (n) => total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1A1209 0%, #2C1F0E 100%)',
      borderRadius: 16, padding: '24px', marginBottom: 28, color: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>AI Review Summary</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Based on {summary.total_reviews} reviews · Avg {summary.average_rating}★
          </div>
        </div>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>
        {summary.summary_text}
      </p>

      {/* Sentiment breakdown bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: '😊 Positive', count: summary.positive_count, color: '#27AE60' },
          { label: '😐 Neutral',  count: summary.neutral_count,  color: '#C9952A' },
          { label: '😞 Negative', count: summary.negative_count, color: '#C0392B' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 80, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{label}</div>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999, background: color,
                width: `${pct(count)}%`, transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ width: 30, fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'right' }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ReviewSection ────────────────────────────────────────────────────────
export default function ReviewSection({ productId, user }) {
  const [reviews,  setReviews]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [submitted,  setSubmitted]  = useState(false);

  // Fetch reviews and AI summary on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsRes, summaryRes] = await Promise.allSettled([
          getReviews(productId),
          getReviewSummary(productId),
        ]);
        if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.data);
        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [productId]);

  const handleSubmit = async () => {
    if (form.rating === 0) { setFormError('Please select a star rating.'); return; }
    if (!form.comment.trim()) { setFormError('Please write a comment.'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await submitReview({ product: productId, ...form });
      // Add new review to top of list
      setReviews(prev => [res.data, ...prev]);
      setForm({ rating: 0, comment: '' });
      setSubmitted(true);
      // Refresh AI summary after new review
      try {
        const s = await getReviewSummary(productId);
        setSummary(s.data);
      } catch (_) {}
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not submit review. You may have already reviewed this product.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      {/* AI Summary */}
      {summary?.summary_text && <AISummaryCard summary={summary} />}

      {/* Submit review form — only for logged-in customers */}
      {user && user.role === 'customer' && !submitted && (
        <div style={{
          background: 'var(--cream)', borderRadius: 14,
          padding: 20, marginBottom: 28,
          border: '1.5px solid var(--border)',
        }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Write a Review</h4>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Your rating</label>
            <StarInput value={form.rating} onChange={v => { setForm(f => ({ ...f, rating: v })); setFormError(''); }} />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Your review</label>
            <textarea
              placeholder="Share your experience with this product…"
              value={form.comment}
              onChange={e => { setForm(f => ({ ...f, comment: e.target.value })); setFormError(''); }}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid var(--border)', fontFamily: 'inherit',
                fontSize: 14, outline: 'none', resize: 'vertical',
              }}
            />
          </div>

          {formError && <div className="form-error" style={{ marginBottom: 10 }}>{formError}</div>}

          <button className="btn-submit" onClick={handleSubmit} disabled={submitting} style={{ margin: 0 }}>
            {submitting
              ? <span className="spinner-row"><span className="spinner" /> Submitting & analysing…</span>
              : 'Submit Review'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            🤖 AI will automatically detect the sentiment of your review and update the product summary.
          </p>
        </div>
      )}

      {submitted && (
        <div style={{
          background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.25)',
          borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Review submitted!</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            AI has analysed your sentiment and updated the product summary.
          </div>
        </div>
      )}

      {/* Reviews list */}
      <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Customer Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h4>

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <span className="spinner" style={{ borderTopColor: 'var(--gold)' }} />
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reviews.map(review => {
          const sStyle = SENTIMENT_STYLE[review.sentiment] || SENTIMENT_STYLE.neutral;
          return (
            <div key={review.id} style={{
              background: '#fff', borderRadius: 14, padding: '18px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{review.customer_name}</div>
                  <div style={{ color: '#C9952A', fontSize: 15, marginTop: 2 }}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {formatDate(review.created_at)}
                  </span>
                  {review.sentiment && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 999, background: sStyle.bg, color: sStyle.color,
                    }}>
                      {sStyle.label}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--dark)', margin: 0 }}>
                {review.comment}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}