from rest_framework import serializers
from .models import RehabilitationActionPlan, RAPVersion, RAPStatus
from apps.patients.serializers import PatientSerializer
from apps.assessments.serializers import ClinicalAssessmentSerializer
from apps.goals.serializers import RehabilitationGoalSerializer
from apps.goals.models import RehabilitationGoal
from apps.assessments.models import ClinicalAssessment
from apps.patients.models import Patient

class RAPVersionSerializer(models_serializer := serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RAPVersion
        fields = [
            'id',
            'version_number',
            'status',
            'action',
            'comments',
            'snapshot',
            'performed_by',
            'performed_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_performed_by_name(self, obj) -> str:
        if obj.performed_by:
            return obj.performed_by.get_full_name() or obj.performed_by.username
        return 'System'

class RAPListSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.full_name')
    patient_id_display = serializers.ReadOnlyField(source='patient.patient_id')
    created_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    goals_count = serializers.IntegerField(source='goals.count', read_only=True)

    class Meta:
        model = RehabilitationActionPlan
        fields = [
            'id',
            'rap_id',
            'title',
            'patient',
            'patient_name',
            'patient_id_display',
            'status',
            'status_display',
            'version',
            'duration_weeks',
            'target_review_date',
            'approval_comments',
            'goals_count',
            'created_by_name',
            'reviewed_by_name',
            'submitted_at',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]

    def get_created_by_name(self, obj) -> str:
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'Not Assigned'

    def get_reviewed_by_name(self, obj) -> str:
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return ''

class RAPDetailSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    assessment = ClinicalAssessmentSerializer(read_only=True)
    goals = RehabilitationGoalSerializer(many=True, read_only=True)
    versions = RAPVersionSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RehabilitationActionPlan
        fields = [
            'id',
            'rap_id',
            'patient',
            'assessment',
            'goals',
            'title',
            'clinical_summary',
            'duration_weeks',
            'target_review_date',
            'status',
            'status_display',
            'version',
            'approval_comments',
            'submitted_at',
            'submitted_by',
            'submitted_by_name',
            'reviewed_at',
            'reviewed_by',
            'reviewed_by_name',
            'created_by',
            'created_by_name',
            'versions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'rap_id', 'version', 'status', 'approval_comments',
            'submitted_at', 'submitted_by', 'reviewed_at', 'reviewed_by',
            'created_by', 'created_at', 'updated_at'
        ]

    def get_created_by_name(self, obj) -> str:
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return ''

    def get_submitted_by_name(self, obj) -> str:
        if obj.submitted_by:
            return obj.submitted_by.get_full_name() or obj.submitted_by.username
        return ''

    def get_reviewed_by_name(self, obj) -> str:
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return ''

class RAPCreateUpdateSerializer(serializers.ModelSerializer):
    goals = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=RehabilitationGoal.objects.all(),
        required=True
    )
    submit_now = serializers.BooleanField(required=False, default=False, write_only=True)

    class Meta:
        model = RehabilitationActionPlan
        fields = [
            'id',
            'patient',
            'assessment',
            'goals',
            'title',
            'clinical_summary',
            'duration_weeks',
            'target_review_date',
            'submit_now',
        ]

    def validate(self, attrs):
        patient = attrs.get('patient') or (self.instance.patient if self.instance else None)
        assessment = attrs.get('assessment') or (self.instance.assessment if self.instance else None)
        goals = attrs.get('goals', [])

        # Ensure assessment belongs to the specified patient
        if assessment and patient and assessment.patient_id != patient.id:
            raise serializers.ValidationError({
                'assessment': 'The selected clinical assessment does not belong to this patient.'
            })

        # Ensure all goals belong to the patient
        if patient and goals:
            for goal in goals:
                if goal.patient_id != patient.id:
                    raise serializers.ValidationError({
                        'goals': f"Goal '{goal.description}' does not belong to this patient."
                    })

        return attrs

    def create(self, validated_data):
        submit_now = validated_data.pop('submit_now', False)
        goals = validated_data.pop('goals', [])
        user = self.context['request'].user

        rap = RehabilitationActionPlan.objects.create(
            created_by=user,
            status=RAPStatus.DRAFT,
            **validated_data
        )
        rap.goals.set(goals)

        # Initial draft snapshot
        rap.record_version_snapshot(
            action='DRAFT_SAVED',
            performed_by=user,
            comments="Initial rehabilitation action plan draft created."
        )

        if submit_now:
            rap.submit_plan(user)

        return rap

    def update(self, instance, validated_data):
        user = self.context['request'].user
        submit_now = validated_data.pop('submit_now', False)
        goals = validated_data.pop('goals', None)

        # Check if plan is returned: editing a returned plan should increment version
        is_returned = instance.status == RAPStatus.RETURNED

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if goals is not None:
            instance.goals.set(goals)

        if is_returned:
            instance.version += 1
            instance.status = RAPStatus.REVISED
            instance.save()
            instance.record_version_snapshot(
                action='REVISED',
                performed_by=user,
                comments=f"Clinician revised plan based on supervisor feedback. Version advanced to {instance.version}."
            )
        else:
            instance.save()
            instance.record_version_snapshot(
                action='DRAFT_SAVED',
                performed_by=user,
                comments="Draft action plan updated."
            )

        if submit_now:
            instance.submit_plan(user)

        return instance

