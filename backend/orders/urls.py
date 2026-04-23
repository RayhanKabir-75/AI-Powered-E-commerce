from django.urls import path
from . import views

urlpatterns = [
    # GET  /api/orders/              — list customer's orders
    path('',                             views.list_orders),

    # POST /api/orders/place/        — place a new order
    path('place/',                       views.place_order),

    # GET  /api/orders/<id>/         — single order detail
    path('<int:order_id>/',              views.order_detail),

    # PATCH /api/orders/<id>/status/ — update status (seller/admin)
    path('<int:order_id>/status/',       views.update_order_status),

    # POST /api/orders/<id>/cancel/  — cancel order (customer)
    path('<int:order_id>/cancel/',       views.cancel_order),
]