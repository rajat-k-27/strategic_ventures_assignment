from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    created_by_name = serializers.SerializerMethodField()
    active_rap_info = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id',
            'patient_id',
            'first_name',
            'last_name',
            'full_name',
            'date_of_birth',
            'age',
            'gender',
            'contact_phone',
            'contact_email',
            'address',
            'primary_diagnosis',
            'secondary_diagnosis',
            'admission_date',
            'status',
            'created_by',
            'created_by_name',
            'active_rap_info',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'patient_id', 'created_by', 'created_at', 'updated_at']

    def get_created_by_name(self, obj) -> str:
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return "System"

    def get_active_rap_info(self, obj):
        latest_rap = obj.raps.order_by('-created_at').first()
        if latest_rap:
            return {
                'id': latest_rap.id,
                'rap_id': latest_rap.rap_id,
                'status': latest_rap.status,
                'version': latest_rap.version,
            }
        return None

