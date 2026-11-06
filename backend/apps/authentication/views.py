from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint returning JWT tokens and serialized user profile.
    """
    serializer_class = CustomTokenObtainPairSerializer

class CurrentUserView(generics.RetrieveAPIView):
    """
    Endpoint to retrieve current authenticated user details.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    """
    List available users / team members for quick switching or assignment.
    """
    queryset = User.objects.filter(is_active=True).order_by('role', 'first_name')
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]  # convenient for POC demo role switcher

