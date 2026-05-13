from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Strict IP-based limit for login / register to prevent brute-force."""
    scope = 'auth'


class OrderRateThrottle(UserRateThrottle):
    """Per-user limit on order placement to prevent abuse."""
    scope = 'orders'
