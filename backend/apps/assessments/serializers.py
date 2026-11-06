from rest_framework import serializers
from .models import ClinicalAssessment
from apps.patients.models import Patient

class ClinicalAssessmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.full_name')
    patient_id_display = serializers.ReadOnlyField(source='patient.patient_id')
    assessor_name = serializers.SerializerMethodField()

    class Meta:
        model = ClinicalAssessment
        fields = [
            'id',
            'patient',
            'patient_name',
            'patient_id_display',
            'assessor',
            'assessor_name',
            'assessment_date',
            'mobility_score',
            'assistive_device',
            'mobility_notes',
            'balance_score',
            'balance_risk',
            'balance_notes',
            'upper_limb_strength_left',
            'upper_limb_strength_right',
            'upper_limb_notes',
            'lower_limb_strength_left',
            'lower_limb_strength_right',
            'lower_limb_notes',
            'clinical_summary',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'assessor', 'created_at', 'updated_at']

    def get_assessor_name(self, obj) -> str:
        if obj.assessor:
            return obj.assessor.get_full_name() or obj.assessor.username
        return "Not Assigned"

