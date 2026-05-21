from pathlib import Path
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-09t1jizk%7q1y1vwc1p!af@g*cya&8@ou&7ahay_kv27daz13$')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['localhost', '127.0.0.1'] + [
    h.strip() for h in os.environ.get('ALLOWED_HOSTS', '').split(',') if h.strip()
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'users',
    'products',
    'orders',
    'reviews',
    'chatbot',
    'product_ai',
    'wishlist',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ecommerce.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────
# Uses DATABASE_URL env var on Render (PostgreSQL), falls back to MySQL locally.
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'ecommerce_db',
            'USER': 'root',
            'PASSWORD': 'sAnu7501',
            'HOST': 'localhost',
            'PORT': '3306',
        }
    }

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon':   '200/hour',
        'user':   '1000/hour',
        'auth':   '10/min',
        'orders': '30/hour',
    },
}

# ── CORS & CSRF ───────────────────────────────────────────────────────────────
_frontend = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
FRONTEND_URL = _frontend if _frontend.startswith('http') else f'https://{_frontend}'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_URL,
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_URL,
]
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_SECURE   = not DEBUG
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
SESSION_COOKIE_SECURE   = not DEBUG

# -- Session settings for auto-logout after inactivity
SESSION_COOKIE_AGE = 900  # 15 minutes
SESSION_SAVE_EVERY_REQUEST = True

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ── Auth password validators ──────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Email ─────────────────────────────────────────────────────────────────────
# Uses SMTP when EMAIL_HOST_PASSWORD is present; falls back to console otherwise.
# Gmail example (.env):
#   EMAIL_HOST_USER     = you@gmail.com
#   EMAIL_HOST_PASSWORD = <16-char app password>
#   DEFAULT_FROM_EMAIL  = ShopAI <you@gmail.com>
# SendGrid example:
#   EMAIL_HOST          = smtp.sendgrid.net
#   EMAIL_HOST_USER     = apikey
#   EMAIL_HOST_PASSWORD = <sendgrid_api_key>
if os.environ.get('EMAIL_HOST_PASSWORD'):
    EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST          = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT          = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS       = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
    EMAIL_HOST_USER     = os.environ.get('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.environ['EMAIL_HOST_PASSWORD']
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    EMAIL_USE_TLS = True

DEFAULT_FROM_EMAIL = (
    os.environ.get('DEFAULT_FROM_EMAIL')
    or os.environ.get('EMAIL_FROM')
    or os.environ.get('EMAIL_HOST_USER')
    or 'ShopAI <noreply@shopai.com>'
)
