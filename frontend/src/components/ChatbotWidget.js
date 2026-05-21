import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotSend, getMediaUrl } from '../api/api';

export default function ChatbotWidget({ open, onToggle, setCart }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! 👋 I\'m your ShopAI assistant. I can help you find products, track orders, or answer any shopping questions!' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg    = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const history = newHistory.map(m => ({ role: m.role, content: m.content }));
      const res     = await chatbotSend({ message: text, history });
      const { reply, action } = res.data;

      const toAdd = [{ role: 'assistant', content: reply }];

      if (action?.type === 'add_to_cart' && setCart) {
        const p = action.product;
        setCart(prev => {
          const existing = prev.find(i => i.cartKey === p.cartKey);
          if (existing) return prev.map(i => i.cartKey === p.cartKey ? { ...i, qty: i.qty + 1 } : i);
          return [...prev, { ...p, qty: 1 }];
        });
        toAdd.push({ role: 'cart_added', product: p });
      } else if (action?.type === 'navigate_to_product') {
        toAdd.push({ role: 'navigate_prompt', product_id: action.product_id, product_name: action.product_name });
      }

      setMessages(prev => [...prev, ...toAdd]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Hi! 👋 I\'m your ShopAI assistant. How can I help you today?' }]);
  };

  return (
    <>
      {/* ── Floating bubble button ── */}
      <button className="chat-fab" onClick={onToggle} title="Chat with AI assistant">
        {open ? '✕' : '💬'}
        {!open && <span className="chat-fab-label">Ask AI</span>}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">🤖</div>
              <div>
                <div className="chat-header-name">ShopAI Assistant</div>
                <div className="chat-header-status">
                  <span className="chat-online-dot" /> Online
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="chat-icon-btn" onClick={clearChat} title="Clear chat">🗑️</button>
              <button className="chat-icon-btn" onClick={onToggle}  title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => {

              // ── Cart-added confirmation card ──────────────────────────────
              if (msg.role === 'cart_added') {
                const p = msg.product;
                return (
                  <div key={i} className="chat-bubble-row assistant">
                    <div className="chat-bot-avatar">🤖</div>
                    <div style={{
                      background: 'rgba(39,174,96,0.1)', border: '1.5px solid rgba(39,174,96,0.3)',
                      borderRadius: 12, padding: '10px 14px', maxWidth: 240,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#27AE60', marginBottom: 6 }}>
                        ✅ Added to cart!
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, overflow: 'hidden',
                          background: 'var(--cream)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>
                          {p.image
                            ? <img src={getMediaUrl(p.image)} alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : '📦'}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#C9952A', fontWeight: 700 }}>
                            ${parseFloat(p.price).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ── Navigate-to-product prompt ────────────────────────────────
              if (msg.role === 'navigate_prompt') {
                return (
                  <div key={i} className="chat-bubble-row assistant">
                    <div className="chat-bot-avatar">🤖</div>
                    <button
                      onClick={() => navigate(`/product/${msg.product_id}`)}
                      style={{
                        background: 'rgba(201,149,42,0.1)', border: '1.5px solid rgba(201,149,42,0.4)',
                        borderRadius: 12, padding: '10px 16px', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#C9952A',
                        textAlign: 'left',
                      }}
                    >
                      View {msg.product_name} → <br />
                      <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--muted)' }}>
                        Select your variant on the product page
                      </span>
                    </button>
                  </div>
                );
              }

              // ── Standard user / assistant bubble ─────────────────────────
              return (
                <div key={i} className={`chat-bubble-row ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="chat-bot-avatar">🤖</div>
                  )}
                  <div className={`chat-bubble ${msg.role}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-bubble-row assistant">
                <div className="chat-bot-avatar">🤖</div>
                <div className="chat-bubble assistant">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestion chips */}
          {messages.length === 1 && (
            <div className="chat-chips">
              {['Find me headphones', 'Track my order', 'Best sellers', 'Help'].map(q => (
                <button key={q} className="chat-chip"
                  onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="Ask me anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}