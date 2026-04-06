from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """
    Custom manager that uses email as the unique identifier
    instead of the default username field.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff',     True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role',         'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('seller',   'Seller'),
        ('admin',    'Admin'),
    ]

    # ── Email is the PRIMARY KEY ────────────────────────────────────────────
    # primary_key=True makes email the table's PK (replaces the default
    # auto-increment integer 'id'). unique=True is implied.
    email = models.EmailField(
        unique=True,
        primary_key=True,
        verbose_name='Email address',
    )

    # ── Drop username — not needed ──────────────────────────────────────────
    # AbstractUser defines username; setting it to None removes the column.
    username = None

    first_name = models.CharField(max_length=50, blank=True)
    last_name  = models.CharField(max_length=50, blank=True)
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    address    = models.TextField(blank=True)
    phone      = models.CharField(max_length=20, blank=True)

    # ── Tell Django to authenticate with email ──────────────────────────────
    USERNAME_FIELD  = 'email'                        # used by authenticate()
    REQUIRED_FIELDS = ['first_name', 'last_name']   # asked by createsuperuser

    objects = UserManager()                          # attach our custom manager

    class Meta:
        verbose_name        = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_full_name(self):
        full = f"{self.first_name} {self.last_name}".strip()
        return full if full else self.email