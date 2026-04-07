## ⚙️ Prerequisites — install these first

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11+ | https://python.org/downloads |
| Node.js | 18+ | https://nodejs.org |
| MySQL | 8+ | https://dev.mysql.com/downloads/installer |
| Git | any | https://git-scm.com |
| VS Code | any | https://code.visualstudio.com |

Verify everything is installed:
```bash
python --version
node --version
mysql --version
git --version
```

---

## SETUP INSTRUCTIONS

### ─── STEP 1 · Clone the repository ───────────────────────────────────────

```bash
git clone https://github.com/YOUR_USERNAME/shopai.git
cd shopai
```

---

### ─── STEP 2 · Create the MySQL database ──────────────────────────────────

Open a terminal and log in to MySQL:
```bash
mysql -u root -p
```
Then run this SQL command:
```sql
CREATE DATABASE ecommerce_db;
exit;
```

---

### ─── STEP 3 · Backend setup ───────────────────────────────────────────────

**3A — Open a terminal and go into the backend folder:**
```bash
cd backend
```

**3B — Create and activate a Python virtual environment:**
```bash
# Create
python -m venv venv

# Activate on Mac / Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```
You will see `(venv)` appear at the start of your terminal line.

**3C — Install all Python packages:**
```bash
pip install -r requirements.txt
```

**3D — Create your `.env` file:**

Create a new file called `.env` inside the `backend/` folder.
Copy this template and fill in your own values:
```
SECRET_KEY=any-long-random-string-you-make-up
DB_NAME=ecommerce_db
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_HOST=localhost
DB_PORT=3306
OPENAI_API_KEY=sk-your-openai-key-here
```

> The `.env` file is in `.gitignore`. NEVER commit it to GitHub.
> Each team member creates their own `.env` with their own DB password.

**3E — Run database migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```
You should see Django creating all tables. No errors means success.

**3F — Create an admin user (first time only):**
```bash
python manage.py createsuperuser
```
Enter your email address, first name, last name, and password.
This creates a regular user. To make them admin, see Step 5 below.

**3G — Start the backend server:**
```bash
python manage.py runserver
```
Backend is running at: **http://localhost:8000**

---

### ─── STEP 4 · Frontend setup ──────────────────────────────────────────────

**Open a NEW terminal window** (keep the backend running in the first one).

**4A — Go into the frontend folder:**
```bash
cd frontend
```

**4B — Install React and create the app (first time only):**
```bash
npx create-react-app .
```
> If the folder is not empty it will ask — type `y` and press Enter.

**4C — Install required packages:**
```bash
npm install axios react-router-dom
```
**4D — Start the frontend:**
```bash
npm start
```
Frontend is running at: **http://localhost:3000**

---