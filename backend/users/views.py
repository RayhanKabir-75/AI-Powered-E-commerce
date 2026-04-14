import os
import json
import urllib.request
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer



# ── Standard Email Register ───────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new Customer or Seller. Admin role is blocked."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user     = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user':  UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Standard Email Login ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login with email + password. Returns auth token."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user     = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user':  UserSerializer(user).data,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Google OAuth ──────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    POST /api/auth/google/
    Body: { "credential": "<Google JWT ID token>", "role": "customer" }

    Google Identity Services sends a JWT ID token (not an access token).
    We decode it by calling Google's tokeninfo endpoint — no extra library needed.

    Flow:
      1. Decode the JWT by calling Google's tokeninfo endpoint
      2. Verify the token belongs to our app (aud matches our client_id)
      3. Get or create user from the email in the token
      4. Return our own auth token
    """
    credential = request.data.get('credential', '').strip()
    role       = request.data.get('role', 'customer')

    if not credential:
        return Response({'error': 'Google credential is required.'}, status=400)

    if role not in ['customer', 'seller']:
        role = 'customer'

    # ── Verify JWT via Google tokeninfo endpoint ──────────────────────────────
    # This is the simplest server-side verification — no library needed.
    # Google verifies the signature and returns the decoded payload.
    try:
        url = f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}'
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return Response(
            {'error': f'Invalid Google token. Google said: {error_body}'},
            status=400
        )
    except Exception as e:
        return Response({'error': f'Could not verify Google token: {str(e)}'}, status=400)

    # ── Optional: verify the token was issued for OUR app ────────────────────
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    if GOOGLE_CLIENT_ID and payload.get('aud') != GOOGLE_CLIENT_ID:
        return Response({'error': 'Google token was not issued for this app.'}, status=400)

    # ── Extract user info ─────────────────────────────────────────────────────
    email      = payload.get('email', '').lower().strip()
    first_name = payload.get('given_name',  '')
    last_name  = payload.get('family_name', '')
    verified   = payload.get('email_verified', 'false')

    if not email:
        return Response({'error': 'Could not get email from Google account.'}, status=400)

    if str(verified).lower() != 'true':
        return Response({'error': 'Google account email is not verified.'}, status=400)

    # ── Get or create user ────────────────────────────────────────────────────
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name':  last_name,
            'role':       role,
            'is_active':  True,
        }
    )

    # Fill in empty name fields from Google if the user already existed
    if not created:
        updated = False
        if not user.first_name and first_name:
            user.first_name = first_name
            updated = True
        if not user.last_name and last_name:
            user.last_name = last_name
            updated = True
        if updated:
            user.save()

    # ── Return token + user ───────────────────────────────────────────────────
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token':   token.key,
        'user':    UserSerializer(user).data,
        'created': created,
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# ── Logout ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    if request.user.is_authenticated:
        try:
            request.user.auth_token.delete()
        except:
            pass
    return Response({'message': 'Logged out successfully.'})


# ── Profile ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """GET your profile. PATCH to update name/address/phone."""
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    allowed    = {k: v for k, v in request.data.items()
                  if k in ['first_name', 'last_name', 'address', 'phone']}
    serializer = UserSerializer(request.user, data=allowed, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
