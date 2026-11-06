from rest_framework import serializers
from .models import RehabilitationGoal

class RehabilitationGoalSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.full_name')
    patient_id_display = serializers.ReadOnlyField(source='patient.patient_id')
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RehabilitationGoal
        fields = [
            'id',
            'patient',
            'patient_name',
            'patient_id_display',
            'category',
            'category_display',
            'description',
            'baseline',
            'target',
            'expected_completion_date',
            'status',
            'status_display',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

