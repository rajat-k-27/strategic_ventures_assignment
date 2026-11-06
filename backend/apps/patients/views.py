from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Patients with search, filtering, and comprehensive history action.
    """
    queryset = Patient.objects.all().select_related('created_by').prefetch_related('raps')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'gender']
    search_fields = ['patient_id', 'first_name', 'last_name', 'primary_diagnosis']
    ordering_fields = ['created_at', 'admission_date', 'last_name']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """
        Returns unified patient overview including assessments, goals, and RAPs.
        """
        patient = self.get_object()
        serializer = self.get_serializer(patient)

        # Import locally to avoid circular dependencies
        from apps.assessments.serializers import ClinicalAssessmentSerializer
        from apps.goals.serializers import RehabilitationGoalSerializer
        from apps.raps.serializers import RAPListSerializer

        assessments_data = ClinicalAssessmentSerializer(
            patient.assessments.all().order_by('-assessment_date'),
            many=True
        ).data

        goals_data = RehabilitationGoalSerializer(
            patient.goals.all().order_by('-created_at'),
            many=True
        ).data

        raps_data = RAPListSerializer(
            patient.raps.all().order_by('-created_at'),
            many=True
        ).data

        return Response({
            'patient': serializer.data,
            'assessments': assessments_data,
            'goals': goals_data,
            'raps': raps_data,
        })

