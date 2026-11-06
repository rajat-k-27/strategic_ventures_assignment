from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import ClinicalAssessment
from .serializers import ClinicalAssessmentSerializer

class ClinicalAssessmentViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Clinical Assessments.
    """
    queryset = ClinicalAssessment.objects.all().select_related('patient', 'assessor')
    serializer_class = ClinicalAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['patient', 'balance_risk']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__patient_id', 'clinical_summary']
    ordering_fields = ['assessment_date', 'created_at']
    ordering = ['-assessment_date']

    def perform_create(self, serializer):
        serializer.save(assessor=self.request.user)

