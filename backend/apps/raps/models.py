import json
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError

from apps.patients.models import Patient
from apps.assessments.models import ClinicalAssessment
from apps.goals.models import RehabilitationGoal

class RAPStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted for Review'
    APPROVED = 'APPROVED', 'Approved'
    RETURNED = 'RETURNED', 'Returned for Revision'
    REVISED = 'REVISED', 'Revised (Ready to Submit)'

class RehabilitationActionPlan(models.Model):
    """
    Core Rehabilitation Action Plan (RAP) integrating assessments, measurable goals,
    and a supervised approval and versioning workflow.
    """
    rap_id = models.CharField(
        max_length=32,
        unique=True,
        editable=False,
        db_index=True,
        help_text="Unique auto-generated RAP identifier (e.g. RAP-20241105-001)"
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='raps'
    )
    assessment = models.ForeignKey(
        ClinicalAssessment,
        on_delete=models.PROTECT,
        related_name='raps',
        help_text="Baseline or reference clinical assessment informing this action plan"
    )
    goals = models.ManyToManyField(
        RehabilitationGoal,
        related_name='raps',
        help_text="Multiple measurable rehabilitation goals addressed by this RAP"
    )
    title = models.CharField(
        max_length=200,
        help_text="Plan Title (e.g. Post-Stroke Neuro-Rehab Phase 1)"
    )
    clinical_summary = models.TextField(
        help_text="Clinical justification, interventions, therapy frequency, and discharge criteria"
    )
    duration_weeks = models.PositiveSmallIntegerField(
        default=6,
        help_text="Estimated duration of this rehabilitation cycle in weeks"
    )
    target_review_date = models.DateField(
        help_text="Scheduled milestone date for formal clinical re-evaluation"
    )
    status = models.CharField(
        max_length=20,
        choices=RAPStatus.choices,
        default=RAPStatus.DRAFT,
        db_index=True
    )
    version = models.PositiveSmallIntegerField(
        default=1,
        help_text="Current plan version counter. Increments when returned and revised."
    )

    # Workflow Audit Fields
    approval_comments = models.TextField(
        blank=True,
        default='',
        help_text="Latest comments or revision notes from clinical supervisor"
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_raps'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_raps'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_raps'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Rehabilitation Action Plan'
        verbose_name_plural = 'Rehabilitation Action Plans'

    def save(self, *args, **kwargs):
        if not self.rap_id:
            today_str = timezone.now().strftime('%Y%m%d')
            count_today = RehabilitationActionPlan.objects.filter(
                rap_id__startswith=f"RAP-{today_str}"
            ).count() + 1
            self.rap_id = f"RAP-{today_str}-{count_today:03d}"
        super().save(*args, **kwargs)

    def generate_snapshot_data(self) -> dict:
        """
        Creates an immutable serialized dictionary of current state, assessment, and goals.
        """
        goals_data = [
            {
                'id': g.id,
                'category': g.category,
                'category_display': g.get_category_display(),
                'description': g.description,
                'baseline': g.baseline,
                'target': g.target,
                'expected_completion_date': str(g.expected_completion_date),
                'status': g.status,
            }
            for g in self.goals.all()
        ]

        assessment_data = None
        if self.assessment:
            assessment_data = {
                'id': self.assessment.id,
                'assessment_date': str(self.assessment.assessment_date),
                'mobility_score': self.assessment.mobility_score,
                'assistive_device': self.assessment.assistive_device,
                'mobility_notes': self.assessment.mobility_notes,
                'balance_score': self.assessment.balance_score,
                'balance_risk': self.assessment.balance_risk,
                'upper_limb_findings': {
                    'left': self.assessment.upper_limb_strength_left,
                    'right': self.assessment.upper_limb_strength_right,
                    'notes': self.assessment.upper_limb_notes,
                },
                'lower_limb_findings': {
                    'left': self.assessment.lower_limb_strength_left,
                    'right': self.assessment.lower_limb_strength_right,
                    'notes': self.assessment.lower_limb_notes,
                },
                'clinical_summary': self.assessment.clinical_summary,
            }

        return {
            'rap_id': self.rap_id,
            'version': self.version,
            'title': self.title,
            'clinical_summary': self.clinical_summary,
            'duration_weeks': self.duration_weeks,
            'target_review_date': str(self.target_review_date),
            'status': self.status,
            'patient': {
                'id': self.patient.id,
                'patient_id': self.patient.patient_id,
                'name': self.patient.full_name,
                'diagnosis': self.patient.primary_diagnosis,
            },
            'assessment': assessment_data,
            'goals': goals_data,
        }

    def record_version_snapshot(self, action: str, performed_by, comments: str = ''):
        """
        Preserves complete version history and audit log in RAPVersion.
        """
        snapshot_data = self.generate_snapshot_data()
        return RAPVersion.objects.create(
            rap=self,
            version_number=self.version,
            status=self.status,
            action=action,
            comments=comments,
            snapshot=snapshot_data,
            performed_by=performed_by,
        )

    # Workflow State Transitions with strict validations
    def submit_plan(self, user):
        """
        Transitions: DRAFT -> SUBMITTED or REVISED -> SUBMITTED
        """
        if self.status not in [RAPStatus.DRAFT, RAPStatus.REVISED]:
            raise ValidationError(
                f"Cannot submit an RAP with status '{self.get_status_display()}'. Must be Draft or Revised."
            )
        if self.goals.count() == 0:
            raise ValidationError("An RAP must be associated with at least one rehabilitation goal before submission.")

        self.status = RAPStatus.SUBMITTED
        self.submitted_at = timezone.now()
        self.submitted_by = user
        self.save(update_fields=['status', 'submitted_at', 'submitted_by', 'updated_at'])
        self.record_version_snapshot(
            action='SUBMITTED',
            performed_by=user,
            comments="Plan submitted for clinical supervisor review."
        )

    def approve_plan(self, user, comments: str = ''):
        """
        Transitions: SUBMITTED -> APPROVED
        """
        if self.status != RAPStatus.SUBMITTED:
            raise ValidationError(
                f"Cannot approve plan in '{self.get_status_display()}' status. Plan must be Submitted."
            )

        self.status = RAPStatus.APPROVED
        self.reviewed_at = timezone.now()
        self.reviewed_by = user
        self.approval_comments = comments or "Approved without additional conditions."
        self.save(update_fields=['status', 'reviewed_at', 'reviewed_by', 'approval_comments', 'updated_at'])
        self.record_version_snapshot(
            action='APPROVED',
            performed_by=user,
            comments=self.approval_comments
        )

    def return_plan(self, user, comments: str):
        """
        Transitions: SUBMITTED -> RETURNED
        Requires reviewer comments explaining reason for return.
        """
        if self.status != RAPStatus.SUBMITTED:
            raise ValidationError(
                f"Cannot return plan in '{self.get_status_display()}' status. Plan must be Submitted."
            )
        if not comments or not comments.strip():
            raise ValidationError("Supervisor feedback comments are mandatory when returning a plan for revision.")

        self.status = RAPStatus.RETURNED
        self.reviewed_at = timezone.now()
        self.reviewed_by = user
        self.approval_comments = comments.strip()
        self.save(update_fields=['status', 'reviewed_at', 'reviewed_by', 'approval_comments', 'updated_at'])
        self.record_version_snapshot(
            action='RETURNED',
            performed_by=user,
            comments=self.approval_comments
        )

    def revise_plan(self, user, comments: str = ''):
        """
        Transitions: RETURNED -> REVISED
        Increments the version number while preserving the old version snapshot.
        """
        if self.status != RAPStatus.RETURNED:
            raise ValidationError(
                f"Cannot revise plan in '{self.get_status_display()}' status. Plan must be Returned."
            )

        self.version += 1
        self.status = RAPStatus.REVISED
        self.save(update_fields=['version', 'status', 'updated_at'])
        self.record_version_snapshot(
            action='REVISED',
            performed_by=user,
            comments=comments or f"Revision initiated. Upgraded to Version {self.version}."
        )

    def __str__(self):
        return f"{self.rap_id} (v{self.version}) - {self.patient.full_name} [{self.get_status_display()}]"


class RAPVersion(models.Model):
    """
    Historical snapshot preserving every revision and workflow transition of an RAP.
    """
    rap = models.ForeignKey(
        RehabilitationActionPlan,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    version_number = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20)
    action = models.CharField(
        max_length=50,
        help_text="e.g. DRAFT_SAVED, SUBMITTED, RETURNED, REVISED, APPROVED"
    )
    comments = models.TextField(blank=True, default='')
    snapshot = models.JSONField(
        help_text="Immutable snapshot of RAP attributes, assessment, and associated goals"
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'RAP Version History'
        verbose_name_plural = 'RAP Version Histories'

    def __str__(self):
        return f"{self.rap.rap_id} - v{self.version_number} ({self.action}) on {self.created_at.strftime('%Y-%m-%d %H:%M')}"

