"""
emails.py
---------
Central email utility for ShopAI.

All emails are sent in a background thread so API responses are never
delayed by SMTP latency. If no EMAIL_HOST is configured Django falls
back to the console backend automatically (see settings.py).

Public functions:
  send_order_confirmation(order)
  send_order_status_update(order)
  send_password_reset(user, reset_link)
"""

import threading
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


# ── Async helper ──────────────────────────────────────────────────────────────

def _send(msg: EmailMultiAlternatives):
    """Fire-and-forget: send in a daemon thread so the view doesn't block."""
    threading.Thread(target=_do_send, args=(msg,), daemon=True).start()


def _do_send(msg):
    try:
        msg.send(fail_silently=False)
    except Exception as e:
        print(f"[ShopAI email] failed to send '{msg.subject}': {e}")


# ── Shared HTML wrapper ───────────────────────────────────────────────────────

def _wrap(body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:#1A1209;padding:28px 32px;text-align:center;">
          <div style="color:#C9952A;font-size:22px;font-weight:bold;letter-spacing:1px;">&#11042; ShopAI</div>
        </td>
      </tr>

      <!-- Body -->
      <tr><td style="padding:32px 36px;">{body_html}</td></tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f5f0e8;padding:20px 32px;text-align:center;
                   font-size:12px;color:#999;border-top:1px solid #e8e0d0;">
          ShopAI &mdash; You&rsquo;re receiving this because you have an account with us.<br>
          <a href="{settings.FRONTEND_URL}" style="color:#C9952A;text-decoration:none;">Visit ShopAI</a>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>"""


def _status_color(status: str) -> str:
    return {
        'pending':   '#C9952A',
        'confirmed': '#4285F4',
        'shipped':   '#8B5E3C',
        'delivered': '#27AE60',
        'cancelled': '#C0392B',
    }.get(status, '#666')


def _status_message(status: str) -> str:
    return {
        'pending':   'We have received your order and it is being reviewed.',
        'confirmed': 'Great news! Your order has been confirmed and is being prepared.',
        'shipped':   'Your order is on its way! Expect it to arrive soon.',
        'delivered': 'Your order has been delivered. We hope you love your purchase!',
        'cancelled': 'Your order has been cancelled. Any payment will be refunded shortly.',
    }.get(status, 'Your order status has been updated.')


# ── Order confirmation ────────────────────────────────────────────────────────

def send_order_confirmation(order):
    """Send HTML order confirmation to the customer after a successful order."""
    customer = order.customer
    to_email = customer.email
    name     = customer.first_name or to_email.split('@')[0]

    items_html = ''.join(
        f"""<tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0ebe0;font-size:14px;">
            {item.product.name}
            {'<span style="font-size:11px;color:#C9952A;background:rgba(201,149,42,0.1);'
             'padding:2px 8px;border-radius:999px;margin-left:6px;">'
             + item.variant.name + '</span>' if item.variant else ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ebe0;font-size:14px;
                     text-align:center;color:#666;">&times;{item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ebe0;font-size:14px;
                     text-align:right;font-weight:bold;color:#C9952A;">
            ${float(item.price * item.quantity):.2f}
          </td>
        </tr>"""
        for item in order.items.select_related('product', 'variant').all()
    )

    body = f"""
<h2 style="margin:0 0 6px;font-size:24px;color:#1A1209;">Order Confirmed! &#10003;</h2>
<p style="margin:0 0 24px;color:#666;font-size:14px;">
  Hi {name}, thank you for your purchase. Here&rsquo;s your order summary.
</p>

<div style="background:#f5f0e8;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <div style="font-size:12px;color:#999;margin-bottom:4px;">ORDER ID</div>
  <div style="font-size:20px;font-weight:bold;color:#1A1209;">#{order.id}</div>
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  <tr>
    <th style="text-align:left;font-size:12px;color:#999;padding-bottom:8px;">ITEM</th>
    <th style="text-align:center;font-size:12px;color:#999;padding-bottom:8px;">QTY</th>
    <th style="text-align:right;font-size:12px;color:#999;padding-bottom:8px;">PRICE</th>
  </tr>
  {items_html}
</table>

<div style="text-align:right;font-size:18px;font-weight:bold;color:#1A1209;
            border-top:2px solid #f0ebe0;padding-top:16px;margin-bottom:28px;">
  Total: <span style="color:#C9952A;">${float(order.total):.2f}</span>
</div>

<a href="{settings.FRONTEND_URL}/home"
   style="display:inline-block;background:#C9952A;color:#fff;padding:13px 28px;
          border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">
  Track Your Order &rarr;
</a>

<p style="margin:24px 0 0;font-size:13px;color:#999;">
  We&rsquo;ll email you again when your order ships.
</p>"""

    msg = EmailMultiAlternatives(
        subject  = f"ShopAI Order #{order.id} Confirmed",
        body     = f"Hi {name}, your ShopAI order #{order.id} for ${float(order.total):.2f} has been confirmed.",
        from_email = settings.DEFAULT_FROM_EMAIL,
        to       = [to_email],
    )
    msg.attach_alternative(_wrap(body), 'text/html')
    _send(msg)


# ── Order status update ───────────────────────────────────────────────────────

def send_order_status_update(order):
    """Send HTML status-change notification to the customer."""
    customer = order.customer
    to_email = customer.email
    name     = customer.first_name or to_email.split('@')[0]
    status   = order.status
    color    = _status_color(status)
    message  = _status_message(status)

    body = f"""
<h2 style="margin:0 0 6px;font-size:24px;color:#1A1209;">Order Update</h2>
<p style="margin:0 0 24px;color:#666;font-size:14px;">Hi {name}, here&rsquo;s the latest on your order.</p>

<div style="background:#f5f0e8;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
  <div style="font-size:12px;color:#999;margin-bottom:4px;">ORDER ID</div>
  <div style="font-size:20px;font-weight:bold;color:#1A1209;">#{order.id}</div>
</div>

<div style="background:rgba(0,0,0,0.03);border-left:4px solid {color};
            border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:28px;">
  <div style="font-size:11px;color:#999;font-weight:bold;letter-spacing:1px;
              text-transform:uppercase;margin-bottom:6px;">New Status</div>
  <div style="font-size:20px;font-weight:bold;color:{color};text-transform:capitalize;
              margin-bottom:8px;">{status}</div>
  <div style="font-size:14px;color:#555;">{message}</div>
</div>

<a href="{settings.FRONTEND_URL}/home"
   style="display:inline-block;background:#C9952A;color:#fff;padding:13px 28px;
          border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">
  View Your Orders &rarr;
</a>"""

    msg = EmailMultiAlternatives(
        subject    = f"ShopAI Order #{order.id} — {status.capitalize()}",
        body       = f"Hi {name}, your ShopAI order #{order.id} is now {status}. {message}",
        from_email = settings.DEFAULT_FROM_EMAIL,
        to         = [to_email],
    )
    msg.attach_alternative(_wrap(body), 'text/html')
    _send(msg)


# ── Password reset ────────────────────────────────────────────────────────────

def send_password_reset(user, reset_link: str):
    """Send HTML password reset email."""
    name = user.first_name or user.email.split('@')[0]

    body = f"""
<h2 style="margin:0 0 6px;font-size:24px;color:#1A1209;">Reset Your Password</h2>
<p style="margin:0 0 24px;color:#666;font-size:14px;">
  Hi {name}, we received a request to reset your ShopAI password.<br>
  Click the button below &mdash; this link expires in <strong>1 hour</strong>.
</p>

<a href="{reset_link}"
   style="display:inline-block;background:#C9952A;color:#fff;padding:13px 28px;
          border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;
          margin-bottom:24px;">
  Reset Password &rarr;
</a>

<p style="font-size:13px;color:#999;margin:0;">
  If you didn&rsquo;t request this, you can safely ignore this email.<br>
  Your password will not be changed.
</p>"""

    msg = EmailMultiAlternatives(
        subject    = "ShopAI — Reset your password",
        body       = f"Hi {name}, reset your password here: {reset_link}",
        from_email = settings.DEFAULT_FROM_EMAIL,
        to         = [user.email],
    )
    msg.attach_alternative(_wrap(body), 'text/html')
    _send(msg)
