import hashlib
import json

from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from rest_framework.authtoken.models import Token


def order_group_name(email):
    return "orders_" + hashlib.sha256(email.encode()).hexdigest()[:32]


class OrderTrackingConsumer(WebsocketConsumer):
    def connect(self):
        qs = self.scope.get('query_string', b'').decode()
        token_key = None
        for part in qs.split('&'):
            if part.startswith('token='):
                token_key = part[len('token='):]
                break

        if not token_key:
            self.close()
            return

        try:
            token = Token.objects.select_related('user').get(key=token_key)
        except Token.DoesNotExist:
            self.close()
            return

        self.user = token.user
        self.group = order_group_name(self.user.email)
        async_to_sync(self.channel_layer.group_add)(self.group, self.channel_name)
        self.accept()

    def disconnect(self, code):
        if hasattr(self, 'group'):
            async_to_sync(self.channel_layer.group_discard)(self.group, self.channel_name)

    def receive(self, text_data=None, bytes_data=None):
        pass

    def order_status_update(self, event):
        self.send(text_data=json.dumps({
            'order_id': event['order_id'],
            'status':   event['status'],
        }))
