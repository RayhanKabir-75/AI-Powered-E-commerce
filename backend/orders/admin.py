from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Shows all items directly inside the order record."""
    model           = OrderItem
    extra           = 0
    readonly_fields = ('product', 'quantity', 'price')
    can_delete      = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ('id', 'customer', 'status', 'total', 'created_at')
    list_filter   = ('status',)
    search_fields = ('customer__email',)
    ordering      = ('-created_at',)
    readonly_fields = ('customer', 'total', 'created_at')
    inlines       = [OrderItemInline]

    # Allow admins to change status from the list view directly
    list_editable = ('status',)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display  = ('id', 'order', 'product', 'quantity', 'price')
    search_fields = ('product__name', 'order__customer__email')
    readonly_fields = ('order', 'product', 'quantity', 'price')