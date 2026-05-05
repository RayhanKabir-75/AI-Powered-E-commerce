# ShopAI — AI-Powered E-Commerce Platform

A full-stack e-commerce web application built with **Django REST Framework** and **React**, featuring AI-powered product recommendations, a local LLM chatbot, AI product description generation, and a complete admin analytics dashboard.

---

## Features

### Customer
- Browse and search a live product catalogue with category filters
- AI-powered **"Recommended for You"** section personalised by browsing history and purchase behaviour
- Floating AI chatbot that answers questions about orders, products, and best sellers using real database data
- Add to cart, proceed to checkout, and complete payment with card validation and a live card preview
- Track order status and review products

### Seller
- Dedicated seller dashboard to add, edit, and delete products (with image upload and AI description generation)
- View incoming orders containing their products
- AI product description generator powered by a local Llama 3.2 model — no API key required

### Admin
- Full analytics dashboard with KPI cards (revenue, orders, customers, products)
- Interactive charts: revenue over time, order status breakdown, top products by revenue, revenue by category
- Order management table with inline status updates and status filter

### AI (Local — No API Key Needed)
- **Chatbot**: Answers customer questions using live order and product data as context
- **Product Descriptions**: Generates compelling listing copy from product details
- **Recommendations**: Tracks browsing history and purchase patterns to personalise the homepage
- All AI features use **Ollama (Llama 3.2)** running locally — free, private, no internet required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, Django 6, Django REST Framework |
| Database | MySQL 8 |
| Frontend | React 19, React Router v7 |
| Charts | Recharts |
| AI / LLM | Ollama (Llama 3.2) — runs locally |
| Auth | DRF Token Authentication + CSRF |
| Styling | Custom CSS (DM Sans + Playfair Display) |

---

## Prerequisites

Install all of these before starting:

| Tool | Version | Download |
|---|---|---|
| Python | 3.11+ | https://python.org/downloads |
| Node.js | 18+ | https://nodejs.org |
| MySQL | 8+ | https://dev.mysql.com/downloads |
| Ollama | latest | https://ollama.com |
| Git | any | https://git-scm.com |

Verify everything is installed:
```bash
python3 --version
node --version
mysql --version
ollama --version
git --version
```

---

## Setup Instructions

### Step 1 — Clone the repository

```bash
git clone https://github.com/RayhanKabir-75/AI-Powered-E-commerce.git
cd AI-Powered-E-commerce
```

---

### Step 2 — Set up the MySQL database

Log in to MySQL and create the database:
```bash
mysql -u root -p
```
```sql
CREATE DATABASE ecommerce_db;
CREATE USER 'ecom_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecom_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### Step 3 — Backend setup

**3A — Go into the backend folder and create a virtual environment:**
```bash
cd backend
python3 -m venv ../venv

# Activate on Mac / Linux
source ../venv/bin/activate

# Activate on Windows
..\venv\Scripts\activate
```

**3B — Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**3C — Create your `.env` file:**

Create a file named `.env` inside the `backend/` folder with the following content:
```
SECRET_KEY=any-long-random-string-you-make-up
DB_NAME=ecommerce_db
DB_USER=ecom_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

> The `.env` file is listed in `.gitignore` — never commit it. Each team member creates their own with their own database credentials.

**3D — Apply database migrations:**
```bash
python3 manage.py migrate
```

**3E — (Optional) Create a superuser for Django admin:**
```bash
python3 manage.py createsuperuser
```

**3F — Start the backend server:**
```bash
python3 manage.py runserver
```

Backend is running at: **http://localhost:8000**

---

### Step 4 — Frontend setup

Open a **new terminal** (keep the backend running).

**4A — Go into the frontend folder and install dependencies:**
```bash
cd frontend
npm install
```

**4B — Start the React development server:**
```bash
npm start
```

Frontend is running at: **http://localhost:3000**

---

### Step 5 — Set up Ollama (AI features)

Ollama runs AI models locally on your machine. This powers the chatbot and product description generator.

**5A — Pull the Llama 3.2 model (one-time download, ~2 GB):**
```bash
ollama pull llama3.2
```

**5B — Start the Ollama server (run in a separate terminal, keep it running):**
```bash
ollama serve
```

> If Ollama is not running, AI features fall back gracefully — the chatbot shows an offline message and the description generator uses a template. The rest of the app works normally.

---

### Step 6 — Seed demo data (optional)

To add categories and sample products for testing, log in to MySQL and run:

```sql
USE ecommerce_db;

INSERT INTO products_category (name) VALUES
  ('Electronics'), ('Accessories'), ('Footwear'),
  ('Appliances'), ('Sports'), ('Home'), ('Bags'),
  ('Clothing'), ('Other');
```

Then create a seller account via the signup page and add products through the Seller Dashboard.

---

## User Roles

| Role | Access | Default redirect after login |
|---|---|---|
| **Customer** | Homepage, cart, checkout, chatbot, order tracking | `/home` |
| **Seller** | Seller dashboard (own products + incoming orders + AI description tool) | `/seller` |
| **Admin** | Admin analytics dashboard, all orders | `/admin` |

To set a user's role, update the `role` field in the `users_customuser` table in MySQL, or use the Django admin panel at **http://localhost:8000/admin**.

---

## Project Structure

```
AI-Powered-E-commerce/
├── backend/
│   ├── ecommerce/          # Django project settings & root URLs
│   ├── users/              # Custom user model, auth endpoints (login, signup, profile)
│   ├── products/           # Product & category models, browsing history, recommendations
│   ├── orders/             # Order models, place/cancel/status endpoints, admin stats
│   ├── product_ai/         # AI product description generator (Ollama)
│   ├── chatbot/            # AI shopping assistant (Ollama + live DB context)
│   ├── reviews/            # Product reviews and AI review summaries
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── api/api.js      # Axios instance + all API call functions
│       ├── pages/
│       │   ├── HomePage.js         # Customer homepage with recommendations
│       │   ├── SellerDashboard.js  # Seller product & order management
│       │   ├── AdminDashboard.js   # Admin charts & order management
│       │   ├── CartPage.js         # Shopping cart
│       │   ├── CheckoutPage.js     # Payment form & order placement
│       │   ├── LoginPage.js
│       │   ├── SignupPage.js
│       │   └── auth.css            # Global stylesheet
│       └── components/
│           ├── ChatbotWidget.js    # Floating AI chat assistant
│           ├── ReviewSection.js    # Product reviews UI
│           ├── ProfileModal.js
│           ├── OrdersModal.js
│           └── AIDescriptionModal.js
│
└── README.md
```

---

## API Endpoints

### Auth — `/api/auth/`
| Method | Endpoint | Description |
|---|---|---|
| POST | `register/` | Create a new account |
| POST | `login/` | Log in, returns auth token |
| POST | `logout/` | Invalidate token |
| GET/PATCH | `profile/` | View or update profile |
| POST | `password-reset/` | Send reset email |

### Products — `/api/products/`
| Method | Endpoint | Description |
|---|---|---|
| GET | `` | List all products (with search & filter) |
| POST | `` | Create product (seller only) |
| GET/PATCH/DELETE | `<id>/` | Retrieve, update, or delete a product |
| GET | `categories/` | List all categories |
| GET | `recommended/` | Personalised product recommendations |
| POST | `<id>/view/` | Track a product view (browsing history) |
| POST | `generate-description/` | AI product description via Ollama |

### Orders — `/api/orders/`
| Method | Endpoint | Description |
|---|---|---|
| GET | `` | Customer's own orders |
| POST | `place/` | Place a new order |
| GET | `<id>/` | Single order detail |
| PATCH | `<id>/status/` | Update order status (seller/admin) |
| POST | `<id>/cancel/` | Cancel a pending order |
| GET | `seller/` | Orders containing seller's products |
| GET | `admin/stats/` | Full platform analytics (admin only) |
| GET | `admin/orders/` | All orders with optional status filter (admin only) |

### Other
| Method | Endpoint | Description |
|---|---|---|
| POST | `api/chatbot/` | Send a message to the AI assistant |
| GET/POST | `api/products/<id>/reviews/` | Get or submit a product review |

---

## Running the Full App

You need **three terminals** running simultaneously:

```bash
# Terminal 1 — Ollama AI server
ollama serve

# Terminal 2 — Django backend
cd backend && source ../venv/bin/activate && python3 manage.py runserver

# Terminal 3 — React frontend
cd frontend && npm start
```

Then open **http://localhost:3000** in your browser.
