from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import User


class LogoutTests(APITestCase):
    def test_logout_accepts_token_auth_and_deletes_token(self):
        user = User.objects.create_user(
            email='logout@example.com',
            password='strongpass123',
            first_name='Log',
            last_name='Out',
            role='customer',
        )
        token = Token.objects.create(user=user)

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.post('/api/auth/logout/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Logged out successfully.')
        self.assertFalse(Token.objects.filter(key=token.key).exists())
