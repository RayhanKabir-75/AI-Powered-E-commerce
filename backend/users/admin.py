from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # What columns show in the list view
    list_display   = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter    = ('role', 'is_staff', 'is_active')
    search_fields  = ('email', 'first_name', 'last_name')
    ordering       = ('email',)

    # Fields shown when you OPEN a user record
    fieldsets = (
        ('Login Info',       {'fields': ('email', 'password')}),
        ('Personal Info',    {'fields': ('first_name', 'last_name', 'phone', 'address')}),
        ('Role & Access',    {'fields': ('role', 'is_staff', 'is_superuser', 'is_active')}),
        ('Dates',            {'fields': ('last_login', 'date_joined')}),
    )

    # Fields shown when you CREATE a new user from admin panel
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    # Because we removed username, tell the parent class not to look for it
    filter_horizontal = ()