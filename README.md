<div align="center">

<h1>
  <img src="https://readme-typing-svg.demolab.com?font=Playfair+Display&size=40&pause=1000&color=C9952A&center=true&vCenter=true&width=600&lines=ShopAI;AI-Powered+E-Commerce" alt="ShopAI" />
</h1>

<p align="center">
  <strong>A production-grade full-stack e-commerce platform with on-device AI — no API keys required.</strong><br/>
  Built with Django REST Framework, React 19, and a locally-running Llama 3.2 model via Ollama.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Ollama-Llama_3.2-F97316?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/WebSocket-Django_Channels-14B8A6?style=for-the-badge"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Role-Customer_|_Seller_|_Admin-C9952A?style=flat-square"/>
  <img src="https://img.shields.io/badge/AI_Features-5-8B5CF6?style=flat-square"/>
  <img src="https://img.shields.io/badge/REST_Endpoints-40+-3B82F6?style=flat-square"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square"/>
</p>

</div>

---

## What is ShopAI?

ShopAI is a full-stack e-commerce web application that integrates **five on-device AI features** with a complete transactional e-commerce backend. Everything runs locally — no paid API keys, no data leaving your machine.

Three distinct user roles (Customer, Seller, Admin) each get a fully tailored experience: customers shop with AI assistance, sellers manage inventory with AI-generated descriptions, and admins monitor the platform through an interactive analytics dashboard.

**Key technical highlights:**
- AI inference via **Ollama (Llama 3.2)** — runs fully on-device, free and private
- **Real-time order tracking** via Django Channels WebSockets
- **Atomic database transactions** — stock is always consistent, zero overselling
- **Google OAuth** + DRF Token Authentication with role-based permissions
- **PDF invoice generation** with ReportLab
- **NLP sentiment analysis** on every product review

---

## Features

<details open>
<summary><strong>🛒 Customer</strong></summary>

| Feature | Description |
|---|---|
| Product Browsing | Search by name, filter by category and price range |
| Product Comparison | Select 2+ products and compare side-by-side |
| AI Recommendations | Personalised "Recommended For You" section based on browsing history |
| Persistent Cart | Cart saved to localStorage, synced to server on login |
| Wishlist | Save products for later, move directly to cart |
| Price Drop Alerts | Set a target price — get notified when a product drops |
| Checkout | Two-step flow: shipping address → card payment with live card preview |
| Promo Codes | Apply discount codes at checkout with server-side validation |
| Real-time Order Tracking | Order status updates pushed via WebSocket — no polling |
| Cancel Orders | Cancel pending orders; stock automatically restored |
| PDF Invoices | Download a branded PDF invoice for any order |
| Reviews & Ratings | Submit 1–5 star reviews; vote on review helpfulness |
| AI Chatbot | Floating assistant powered by Llama 3.2 — answers product/order questions and adds items to cart via intent detection |

</details>

<details>
<summary><strong>🏪 Seller</strong></summary>

| Feature | Description |
|---|---|
| Product CRUD | Create, edit, and delete product listings |
| Product Variants | Add size/colour/style variants with individual prices and stock |
| Gallery Management | Upload multiple images, reorder them via drag-and-drop |
| AI Description Generator | Enter product name + price → Ollama generates marketing copy |
| Order Management | View all orders containing own products, update status |
| Sales Analytics | Units sold, revenue trends, order insights |

</details>

<details>
<summary><strong>📊 Admin</strong></summary>

| Feature | Description |
|---|---|
| KPI Dashboard | Total revenue, orders, customers, products — all at a glance |
| Revenue Chart | Daily revenue over the last 30 days (Recharts line chart) |
| Order Status Breakdown | Pie chart showing pending / confirmed / shipped / delivered split |
| Top Products | Bar chart of top 10 products by revenue |
| Category Revenue | Bar chart of revenue broken down by product category |
| Order Management | Full order table with status filter and inline status updates |
| Promo Code Management | Create, edit, delete, and toggle promo codes with expiry and usage limits |

</details>

---

## AI Features

All five AI features run on **Ollama (Llama 3.2)** locally. If Ollama is offline, every feature degrades gracefully — the rest of the app continues working normally.

```
┌─────────────────────────────────────────────────────────┐
│                    AI FEATURE OVERVIEW                  │
├──────────────────────┬──────────────────────────────────┤
│ 💬 Shopping Chatbot  │ Answers questions using live DB   │
│                      │ context (orders + bestsellers).   │
│                      │ Detects "add X to cart" intent    │
│                      │ and executes cart actions.        │
├──────────────────────┼──────────────────────────────────┤
│ 🎯 Recommendations   │ Tracks product views per user.    │
│                      │ Surfaces personalised products    │
│                      │ on the homepage.                  │
├──────────────────────┼──────────────────────────────────┤
│ ✍️  Description Gen  │ Seller enters name + price →      │
│                      │ Llama 3.2 writes the listing      │
│                      │ description. Zero editing needed. │
├──────────────────────┼──────────────────────────────────┤
│ 🧠 NLP Sentiment     │ Every review is auto-classified   │
│                      │ Positive / Neutral / Negative     │
│                      │ on submission.                    │
├──────────────────────┼──────────────────────────────────┤
│ 📝 Review Summary    │ Ollama generates a one-paragraph  │
│                      │ summary of all reviews per        │
│                      │ product. Refreshes on each new    │
│                      │ review.                           │
└──────────────────────┴──────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend** | Python 3.11, Django 6, Django REST Framework | API, ORM, business logic |
| **Database** | MySQL 8 | Relational data, atomic transactions |
| **Frontend** | React 19, React Router v7 | Single-page application |
| **Charts** | Recharts | Admin analytics visualisations |
| **AI / LLM** | Ollama · Llama 3.2 | On-device inference — free, private |
| **Real-time** | Django Channels, ASGI | WebSocket order status broadcasts |
| **Auth** | DRF Token Auth + Google OAuth | Secure login with social option |
| **PDF** | ReportLab | Branded invoice generation |
| **Email** | SMTP / SendGrid | Order confirmations, password reset |
| **Static Files** | WhiteNoise | Compressed static file serving |
| **Styling** | Custom CSS — DM Sans + Playfair Display | Consistent dark/light theme |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│               CLIENT (React 19)              │
│  Router · Context API · LocalStorage Cart    │
│  Recharts · Google OAuth · WebSocket Client  │
└──────────────────┬───────────────────────────┘
                   │ HTTP / REST  |  WebSocket
┌──────────────────▼───────────────────────────┐
│         API LAYER (Django REST Framework)    │
│  Token Auth · CORS/CSRF · Throttling         │
│  Permissions · Pagination · Serializers      │
└──────┬──────────────────────────┬────────────┘
       │ ORM + Atomic Transactions │ ASGI
┌──────▼──────────┐     ┌─────────▼───────────┐
│  BUSINESS LOGIC │     │  REAL-TIME LAYER    │
│  users          │     │  Django Channels    │
│  products       │     │  WebSocket Consumer │
│  orders         │     └─────────────────────┘
│  reviews        │
│  cart           │     ┌─────────────────────┐
│  wishlist       │     │    AI LAYER         │
│  alerts         │◄────│  Ollama · Llama 3.2 │
│  chatbot        │     │  NLP Sentiment      │
│  product_ai     │     └─────────────────────┘
└──────┬──────────┘
       │ Django ORM
┌──────▼──────────────────────────────────────┐
│               DATA LAYER                    │
│  MySQL 8 · WhiteNoise · Media · SMTP Email  │
└─────────────────────────────────────────────┘
```

---

## Project Structure

```
ShopAI/
├── backend/
│   ├── ecommerce/           # Django project — settings, root URLs, ASGI
│   ├── users/               # Custom User model (email PK), auth endpoints
│   ├── products/            # Products, categories, variants, gallery, browsing history
│   ├── orders/              # Orders, order items, promo codes, PDF invoices
│   ├── reviews/             # Reviews, NLP sentiment, AI summaries, helpfulness votes
│   ├── cart/                # Cart persistence and server sync
│   ├── wishlist/            # Saved products per user
│   ├── alerts/              # Price-drop alert management
│   ├── chatbot/             # AI shopping assistant (Ollama + live DB context)
│   ├── product_ai/          # AI product description generator
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── api/api.js                  # Axios instance + all API calls
│       ├── pages/
│       │   ├── LandingPage.jsx         # Hero / entry point
│       │   ├── HomePage.jsx            # Customer browse + recommendations
│       │   ├── ProductPage.jsx         # Detail, gallery, variants, reviews
│       │   ├── CartPage.jsx            # Cart management + promo codes
│       │   ├── CheckoutPage.jsx        # Shipping form + card payment
│       │   ├── WishlistPage.jsx        # Saved items
│       │   ├── SearchResultsPage.jsx   # Search + comparison
│       │   ├── SellerDashboard.jsx     # Seller product/order management
│       │   ├── AdminDashboard.jsx      # Admin analytics + order mgmt
│       │   ├── LoginPage.jsx
│       │   └── SignupPage.jsx
│       └── components/
│           ├── ChatbotWidget.jsx       # Floating AI chat assistant
│           ├── ReviewSection.jsx       # Reviews UI + AI summary
│           ├── ProductComparison.jsx   # Side-by-side comparison
│           ├── ProfileModal.jsx
│           ├── OrdersModal.jsx
│           └── AIDescriptionModal.jsx  # Seller description generator
│
└── README.md
```

---

## API Reference

<details>
<summary><strong>Authentication — <code>/api/auth/</code></strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `register/` | None | Create customer or seller account |
| `POST` | `login/` | None | Returns DRF auth token |
| `POST` | `google/` | None | Google OAuth sign-in |
| `POST` | `logout/` | Token | Invalidate token |
| `GET` | `profile/` | Token | View user profile |
| `PATCH` | `profile/` | Token | Update profile fields |
| `POST` | `password-reset/` | None | Send reset email |

</details>

<details>
<summary><strong>Products — <code>/api/products/</code></strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | None | List products (search, category, price filter) |
| `POST` | `/` | Seller | Create new product |
| `GET/PATCH/DELETE` | `<id>/` | Mixed | Product CRUD |
| `GET` | `categories/` | None | All categories |
| `GET` | `recommended/` | Token | AI personalised recommendations |
| `POST` | `<id>/view/` | Token | Log a product view |
| `GET/POST` | `<id>/variants/` | Mixed | List or add variants |
| `DELETE` | `<id>/variants/<vid>/` | Seller | Remove a variant |
| `GET/POST` | `<id>/gallery/` | Mixed | Manage gallery images |
| `POST` | `generate-description/` | Seller | AI description via Ollama |

</details>

<details>
<summary><strong>Orders — <code>/api/orders/</code></strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Token | Customer's own orders |
| `POST` | `place/` | Token | Place order (atomic, validates stock) |
| `GET` | `<id>/` | Token | Order detail |
| `PATCH` | `<id>/status/` | Seller/Admin | Update order status |
| `POST` | `<id>/cancel/` | Token | Cancel pending order (restores stock) |
| `GET` | `<id>/invoice/` | Token | Download PDF invoice |
| `GET` | `seller/` | Seller | Orders containing seller's products |
| `GET` | `admin/stats/` | Admin | Full platform analytics |
| `GET` | `admin/orders/` | Admin | All orders with optional status filter |
| `POST` | `validate-promo/` | Token | Validate a promo code |
| `GET/POST` | `admin/promos/` | Admin | Promo code management |

</details>

<details>
<summary><strong>Reviews, Cart, Wishlist, Alerts, Chatbot</strong></summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `api/reviews/` | None | Reviews for a product |
| `POST` | `api/reviews/` | Token | Submit review (auto-runs NLP) |
| `GET` | `api/reviews/summary/<id>/` | None | AI-generated review summary |
| `POST` | `api/reviews/<id>/vote/` | Token | Toggle helpful vote |
| `GET` | `api/cart/` | Token | Retrieve cart |
| `POST` | `api/cart/sync/` | Token | Sync local cart to server |
| `GET` | `api/wishlist/` | Token | List saved items |
| `POST` | `api/wishlist/toggle/` | Token | Add or remove from wishlist |
| `GET` | `api/alerts/` | Token | List price alerts |
| `POST` | `api/alerts/` | Token | Create or update alert |
| `DELETE` | `api/alerts/<product_id>/` | Token | Delete alert |
| `POST` | `api/chatbot/` | Token | Send message to AI assistant |

</details>

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| MySQL | 8+ |
| Ollama | latest |
| Git | any |

### 1 — Clone the repository

```bash
git clone https://github.com/RayhanKabir-75/AI-Powered-E-commerce.git
cd AI-Powered-E-commerce
```

### 2 — Create the MySQL database

```sql
CREATE DATABASE ecommerce_db;
CREATE USER 'ecom_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecom_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3 — Backend

```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate          # Windows: ..\venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
DB_NAME=ecommerce_db
DB_USER=ecom_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

```bash
python3 manage.py migrate
python3 manage.py runserver          # → http://localhost:8000
```

### 4 — Frontend

```bash
cd frontend
npm install
npm start                            # → http://localhost:3000
```

### 5 — Ollama (AI features)

```bash
ollama pull llama3.2                 # one-time ~2 GB download
ollama serve                         # keep running in a separate terminal
```

> If Ollama is not running, all AI features fall back gracefully. The rest of the app is fully functional.

### 6 — Seed categories (optional)

```sql
USE ecommerce_db;
INSERT INTO products_category (name) VALUES
  ('Electronics'), ('Accessories'), ('Footwear'),
  ('Appliances'), ('Sports'), ('Home'), ('Bags'), ('Clothing');
```

---

## User Roles

| Role | Login redirect | Key access |
|---|---|---|
| **Customer** | `/home` | Browse, cart, checkout, chatbot, order tracking, wishlist |
| **Seller** | `/seller` | Product management, gallery, AI descriptions, order fulfilment |
| **Admin** | `/admin` | Analytics dashboard, all orders, promo code management |

Set a user's role via the Django admin panel at `http://localhost:8000/admin` or directly in MySQL.

---

## Security

- **DRF Token Authentication** on all protected endpoints
- **Google OAuth** via `tokeninfo` — raw passwords never stored for social accounts
- **CSRF protection** with trusted origins; `SameSite` and `Secure` cookie flags
- **Role-based permissions** enforced at the view level (Customer / Seller / Admin)
- **Rate throttling** — Anonymous: 200/h · Authenticated: 1000/h · Login: 10/min · Orders: 30/h
- **Atomic DB transactions** on order placement and cancellation — no partial writes, no overselling
- **Auto-logout** after 15 minutes of inactivity (frontend)
- **Django password validators** — length, similarity, common-password checks

---

## Running the Full Stack

You need three terminals:

```bash
# Terminal 1 — Ollama AI server
ollama serve

# Terminal 2 — Django backend
cd backend && source ../venv/bin/activate && python3 manage.py runserver

# Terminal 3 — React frontend
cd frontend && npm start
```

Open **http://localhost:3000**

---

## License

MIT — see [LICENSE](LICENSE) for details.
