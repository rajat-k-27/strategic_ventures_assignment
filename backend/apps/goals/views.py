from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import RehabilitationGoal
from .serializers import RehabilitationGoalSerializer

class RehabilitationGoalViewSet(viewsets.ModelViewSet):
    """
    CRUD API for patient Rehabilitation Goals.
    """
    queryset = RehabilitationGoal.objects.all().select_related('patient', 'created_by')
    serializer_class = RehabilitationGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['patient', 'category', 'status']
    search_fields = ['description', 'baseline', 'target', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['expected_completion_date', 'created_at', 'status']
    ordering = ['expected_completion_date']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

