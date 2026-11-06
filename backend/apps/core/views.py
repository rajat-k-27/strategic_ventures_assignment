from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.patients.models import Patient, PatientStatus
from apps.raps.models import RehabilitationActionPlan, RAPStatus
from apps.assessments.models import ClinicalAssessment
from apps.goals.models import RehabilitationGoal

class DashboardStatsView(APIView):
    """
    Consolidated analytics for clinical operations and approval queue.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_patients = Patient.objects.count()
        active_patients = Patient.objects.filter(status=PatientStatus.ACTIVE).count()
        total_assessments = ClinicalAssessment.objects.count()
        total_goals = RehabilitationGoal.objects.count()

        rap_counts = {
            'total': RehabilitationActionPlan.objects.count(),
            'draft': RehabilitationActionPlan.objects.filter(status=RAPStatus.DRAFT).count(),
            'submitted': RehabilitationActionPlan.objects.filter(status=RAPStatus.SUBMITTED).count(),
            'returned': RehabilitationActionPlan.objects.filter(status=RAPStatus.RETURNED).count(),
            'revised': RehabilitationActionPlan.objects.filter(status=RAPStatus.REVISED).count(),
            'approved': RehabilitationActionPlan.objects.filter(status=RAPStatus.APPROVED).count(),
        }

        # Recent RAPs
        recent_raps = RehabilitationActionPlan.objects.select_related(
            'patient'
        ).order_by('-updated_at')[:5]

        recent_raps_data = [
            {
                'id': rap.id,
                'rap_id': rap.rap_id,
                'title': rap.title,
                'patient_name': rap.patient.full_name,
                'status': rap.status,
                'status_display': rap.get_status_display(),
                'version': rap.version,
                'updated_at': rap.updated_at,
            }
            for rap in recent_raps
        ]

        return Response({
            'patients': {
                'total': total_patients,
                'active': active_patients,
            },
            'clinical': {
                'total_assessments': total_assessments,
                'total_goals': total_goals,
            },
            'raps': rap_counts,
            'recent_raps': recent_raps_data,
        })

