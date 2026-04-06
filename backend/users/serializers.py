from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'password', 'role']

    def validate_role(self, value):
        # ✅ SECURITY: Block admin self-registration.
        # Admin accounts are created only via Django shell by the dev team.
        if value not in ['customer', 'seller']:
            raise serializers.ValidationError(
                "Invalid role. Only 'customer' or 'seller' are allowed at registration."
            )
        return value

    def create(self, validated_data):
        # Use our custom manager — email is the primary key, no username
        return User.objects.create_user(
            email      = validated_data['email'],
            password   = validated_data['password'],
            first_name = validated_data.get('first_name', ''),
            last_name  = validated_data.get('last_name', ''),
            role       = validated_data.get('role', 'customer'),
        )


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # authenticate() uses USERNAME_FIELD which is now 'email'
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'full_name',
                  'role', 'address', 'phone']

    def get_full_name(self, obj):
        return obj.get_full_name()