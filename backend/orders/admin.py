from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Shows order items directly inside the order page."""
    model  = OrderItem
    extra  = 0
    readonly_fields = ('subtotal',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ('id', 'customer', 'status', 'total', 'created_at')
    list_filter   = ('status',)
    search_fields = ('customer__email',)
    ordering      = ('-created_at',)
    inlines       = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display  = ('id', 'order', 'product', 'quantity', 'price')
    search_fields = ('product__name', 'order__customer__email')