from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new Customer or Seller account.
    Email is the primary key — duplicate emails are rejected automatically.
    Admin role is blocked at the serializer level.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user     = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user':  UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login with email + password.
    Returns an auth token and the user's profile.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user     = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user':  UserSerializer(user).data,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Delete the user's token — effectively logging them out."""
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    GET  — return current user's profile.
    PATCH — update name, address, phone (role and email cannot be changed here).
    """
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    # PATCH — only allow safe fields to be updated
    allowed = {k: v for k, v in request.data.items()
               if k in ['first_name', 'last_name', 'address', 'phone']}
    serializer = UserSerializer(request.user, data=allowed, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)