from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'title',
            'license_number',
            'is_clinician',
            'is_supervisor',
        ]
        read_only_fields = ['id', 'is_clinician', 'is_supervisor', 'full_name']

    def get_full_name(self, obj) -> str:
        name = obj.get_full_name()
        return name if name else obj.username

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends JWT payload with user details and role information for frontend state.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['name'] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

