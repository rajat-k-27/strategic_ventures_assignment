from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from .models import RehabilitationActionPlan, RAPVersion, RAPStatus
from .serializers import (
    RAPListSerializer,
    RAPDetailSerializer,
    RAPCreateUpdateSerializer,
    RAPVersionSerializer,
)
from apps.authentication.permissions import IsSupervisor, IsClinician

class RehabilitationActionPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet managing the complete lifecycle of Rehabilitation Action Plans:
    Draft -> Submitted -> Approved or Returned -> Revised -> Submitted.
    """
    queryset = RehabilitationActionPlan.objects.all().select_related(
        'patient', 'assessment', 'created_by', 'submitted_by', 'reviewed_by'
    ).prefetch_related('goals', 'versions')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'patient', 'version']
    search_fields = ['rap_id', 'title', 'patient__first_name', 'patient__last_name', 'patient__patient_id']
    ordering_fields = ['created_at', 'updated_at', 'target_review_date', 'status']
    ordering = ['-updated_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RAPListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return RAPCreateUpdateSerializer
        return RAPDetailSerializer

    def get_permissions(self):
        """
        Enforce role-based permissions:
        - Clinicians: Create, update/revise, and submit action plans.
        - Supervisors: Review, approve, and return action plans.
        - Read actions: Allowed for all authenticated clinical staff.
        """
        if self.action in ['approve', 'return_plan']:
            return [permissions.IsAuthenticated(), IsSupervisor()]
        elif self.action in ['create', 'update', 'partial_update', 'submit']:
            return [permissions.IsAuthenticated(), IsClinician()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'], permission_classes=[IsClinician])
    def submit(self, request, pk=None):
        """
        Transition: DRAFT or REVISED -> SUBMITTED.
        Requires Clinician role.
        """
        rap = self.get_object()
        try:
            rap.submit_plan(request.user)
            serializer = RAPDetailSerializer(rap)
            return Response({
                'message': f"Plan {rap.rap_id} successfully submitted for supervisor approval.",
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsSupervisor])
    def approve(self, request, pk=None):
        """
        Transition: SUBMITTED -> APPROVED.
        Requires Supervisor / Approver role.
        """
        rap = self.get_object()
        comments = request.data.get('comments', '')
        try:
            rap.approve_plan(request.user, comments)
            serializer = RAPDetailSerializer(rap)
            return Response({
                'message': f"Plan {rap.rap_id} successfully approved.",
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsSupervisor])
    def return_plan(self, request, pk=None):
        """
        Transition: SUBMITTED -> RETURNED.
        Requires Supervisor role and mandatory review feedback comments.
        """
        rap = self.get_object()
        comments = request.data.get('comments', '')
        if not comments or not comments.strip():
            return Response(
                {'error': 'Approval comments explaining the revision requirements are mandatory when returning a plan.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rap.return_plan(request.user, comments)
            serializer = RAPDetailSerializer(rap)
            return Response({
                'message': f"Plan {rap.rap_id} returned for clinician revision.",
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """
        Retrieves all version snapshots and audit entries for the action plan.
        """
        rap = self.get_object()
        versions = rap.versions.all().order_by('-created_at')
        serializer = RAPVersionSerializer(versions, many=True)
        return Response(serializer.data)

