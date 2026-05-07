import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LogoMark from '../components/LogoMark';
import { getProduct, trackProductView, getMediaUrl } from '../api/api';
import ReviewSection from '../components/ReviewSection';

const CATEGORY_EMOJIS = {
  Electronics: '🎧', Accessories: '👜', Footwear: '👟',
  Appliances: '☕', Sports: '🧘', Home: '💡', Bags: '🎒',
  Clothing: '👕', Other: '📦',
};

export default function ProductPage({ user, cart, setCart, wishlistIds = new Set(), onToggleWishlist }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product,         setProduct]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [addedToCart,     setAddedToCart]     = useState(false);
  const [qty,             setQty]             = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getProduct(id);
        setProduct(res.data);
        trackProductView(id).catch(() => {});
      } catch {
        setError('Product not found.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const hasVariants  = product?.variants?.length > 0;
  const activeStock  = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const activePrice  = selectedVariant
    ? parseFloat(selectedVariant.effective_price)
    : product ? parseFloat(product.price) : 0;

  const addToCart = () => {
    const cartKey = `${product.id}_${selectedVariant?.id || 0}`;
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        return prev.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, {
        ...product,
        cartKey,
        price:        activePrice,
        variant_id:   selectedVariant?.id   || null,
        variant_name: selectedVariant?.name || null,
        qty,
      }];
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const getEmoji = (p) => CATEGORY_EMOJIS[p?.category_name] || '📦';

  const imageUrl = product?.image
    ? (product.image.startsWith('http')
        ? product.image
        : getMediaUrl(product.image))
    : null;

  return (
    <div className="home page">

      {/* ── Nav ── */}
      <nav className="home-nav">
        <div className="nav-logo" onClick={() => navigate('/home')} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <LogoMark size={34} />
          ShopAI
        </div>
        <div className="home-nav-right">
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/home')}>
            ← Back to Shop
          </button>
          <button onClick={() => navigate('/cart')} style={{
            position: 'relative', background: 'none', border: '1.5px solid var(--border)',
            borderRadius: 999, padding: '6px 14px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6, fontSize: 14, fontFamily: 'inherit',
          }}>
            🛒
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, background: 'var(--gold)',
                color: '#fff', borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      <div className="home-main" style={{ maxWidth: 900, margin: '0 auto' }}>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 20 }}>
            <div style={{ height: 400, borderRadius: 16, background: 'var(--cream)', animation: 'shimmer 1.5s infinite' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[200, 100, 60, 80, 120].map((w, i) => (
                <div key={i} style={{ height: 20, width: `${w}px`, borderRadius: 8, background: 'var(--cream)', animation: 'shimmer 1.5s infinite' }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/home')}>Back to Shop</button>
          </div>
        )}

        {product && (
          <>
            {/* Breadcrumb */}
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ cursor: 'pointer', color: 'var(--gold)' }} onClick={() => navigate('/home')}>Home</span>
              <span>›</span>
              {product.category_name && (
                <>
                  <span style={{ cursor: 'pointer', color: 'var(--gold)' }} onClick={() => navigate('/home')}>{product.category_name}</span>
                  <span>›</span>
                </>
              )}
              <span>{product.name}</span>
            </div>

            {/* ── Product Hero ── */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40,
              background: 'var(--panel)', borderRadius: 20, border: '1px solid var(--border)',
              padding: 36, marginBottom: 32, animation: 'fadeUp 0.3s ease both',
            }}>

              {/* Image */}
              <div style={{
                borderRadius: 14, overflow: 'hidden', background: 'var(--cream)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 320, border: '1px solid var(--border)',
              }}>
                {imageUrl
                  ? <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 96 }}>{getEmoji(product)}</span>
                }
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {product.category_name && (
                    <div style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1,
                      textTransform: 'uppercase', color: 'var(--gold)', background: 'rgba(201,149,42,0.1)',
                      padding: '4px 10px', borderRadius: 999, marginBottom: 12,
                    }}>
                      {product.category_name}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <h1 style={{
                      fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
                      lineHeight: 1.25, flex: 1, margin: 0,
                    }}>
                      {product.name}
                    </h1>
                    {onToggleWishlist && (
                      <button
                        onClick={() => onToggleWishlist(product.id)}
                        title={wishlistIds.has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                        style={{
                          flexShrink: 0, marginTop: 4,
                          background: wishlistIds.has(product.id) ? 'rgba(231,76,60,0.08)' : 'var(--cream)',
                          border: `1.5px solid ${wishlistIds.has(product.id) ? '#e74c3c' : 'var(--border)'}`,
                          borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
                          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: wishlistIds.has(product.id) ? '#e74c3c' : 'var(--muted)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {wishlistIds.has(product.id) ? '♥' : '♡'}
                      </button>
                    )}
                  </div>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ color: '#C9952A', fontSize: 18 }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ opacity: s <= Math.round(product.avg_rating || 0) ? 1 : 0.25 }}>★</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                      {product.avg_rating > 0 ? `${product.avg_rating} / 5` : 'No reviews yet'}
                    </span>
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--gold)', marginBottom: 16 }}>
                    ${activePrice.toFixed(2)}
                    {selectedVariant?.price !== null && selectedVariant && parseFloat(selectedVariant.price) !== parseFloat(product.price) && (
                      <span style={{ fontSize: 16, color: 'var(--muted)', textDecoration: 'line-through', marginLeft: 10 }}>
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
                      {product.description}
                    </p>
                  )}

                  {/* Variant selector */}
                  {hasVariants && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Select Option <span style={{ color: 'var(--danger)', fontSize: 11 }}>*</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {product.variants.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                            style={{
                              padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                              fontFamily: 'inherit', transition: 'all 0.15s',
                              border: selectedVariant?.id === v.id
                                ? '2px solid var(--gold)'
                                : '1.5px solid var(--border)',
                              background: selectedVariant?.id === v.id
                                ? 'rgba(201,149,42,0.1)'
                                : 'var(--cream)',
                              color: selectedVariant?.id === v.id ? 'var(--gold)' : 'var(--dark)',
                              fontWeight: selectedVariant?.id === v.id ? 700 : 400,
                              opacity: v.stock === 0 ? 0.4 : 1,
                            }}
                          >
                            {v.name}
                            {v.stock === 0 && <span style={{ fontSize: 10, marginLeft: 4 }}>sold out</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: activeStock > 0 ? 'var(--success)' : 'var(--danger)',
                    }} />
                    {activeStock > 0
                      ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>In Stock ({activeStock} available)</span>
                      : <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Out of Stock</span>
                    }
                  </div>
                </div>

                {/* Add to Cart */}
                {hasVariants && !selectedVariant ? (
                  <button disabled style={{
                    width: '100%', padding: '14px 0', fontSize: 15, borderRadius: 10,
                    background: 'var(--cream)', border: '1.5px dashed var(--border)',
                    color: 'var(--muted)', cursor: 'not-allowed',
                  }}>
                    Select an option above
                  </button>
                ) : activeStock > 0 ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Qty:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                          width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border)',
                          background: 'none', cursor: 'pointer', fontSize: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: 'center' }}>{qty}</span>
                        <button onClick={() => setQty(q => Math.min(activeStock, q + 1))} style={{
                          width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border)',
                          background: 'none', cursor: 'pointer', fontSize: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>+</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '14px 0', fontSize: 15 }}
                        onClick={addToCart}
                      >
                        {addedToCart ? '✓ Added to Cart!' : '+ Add to Cart'}
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '14px 20px', fontSize: 15 }}
                        onClick={() => { addToCart(); navigate('/cart'); }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <button disabled style={{
                    width: '100%', padding: '14px 0', fontSize: 15, borderRadius: 10,
                    background: 'var(--border)', border: 'none', color: 'var(--muted)', cursor: 'not-allowed',
                  }}>
                    Out of Stock
                  </button>
                )}
              </div>
            </div>

            {/* ── Reviews ── */}
            <div style={{
              background: 'var(--panel)', borderRadius: 20, border: '1px solid var(--border)',
              padding: 32, animation: 'fadeUp 0.4s ease both',
            }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                Reviews & Ratings
              </h2>
              <ReviewSection productId={product.id} user={user} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}