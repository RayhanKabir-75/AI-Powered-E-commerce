import React, { useState, useRef, useEffect } from 'react';
import { chatbotSend } from '../api/api';

export default function ChatbotWidget({ open, onToggle }) {
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

    const userMsg   = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Send full conversation history so the AI has context
      const history = newHistory.map(m => ({ role: m.role, content: m.content }));
      const res = await chatbotSend({ message: text, history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.'
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
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-bot-avatar">🤖</div>
                )}
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              </div>
            ))}

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