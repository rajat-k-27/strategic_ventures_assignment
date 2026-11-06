from django.db import models
from django.conf import settings
from apps.patients.models import Patient

class GoalCategory(models.TextChoices):
    MOBILITY = 'MOBILITY', 'Functional Mobility'
    BALANCE = 'BALANCE', 'Balance & Posture'
    UPPER_LIMB = 'UPPER_LIMB', 'Upper Limb & Fine Motor'
    LOWER_LIMB = 'LOWER_LIMB', 'Lower Limb & Gait'
    ADL = 'ADL', 'Activities of Daily Living (ADL)'
    COGNITIVE = 'COGNITIVE', 'Cognitive & Safety Awareness'

class GoalStatus(models.TextChoices):
    NOT_STARTED = 'NOT_STARTED', 'Not Started'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    ACHIEVED = 'ACHIEVED', 'Goal Achieved'
    REVISED = 'REVISED', 'Goal Revised'

class RehabilitationGoal(models.Model):
    """
    Measurable rehabilitation goal associated with a patient, capturing baseline vs target.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='goals'
    )
    category = models.CharField(
        max_length=30,
        choices=GoalCategory.choices,
        default=GoalCategory.MOBILITY
    )
    description = models.CharField(
        max_length=255,
        help_text="Goal objective (e.g. Independent sit-to-stand transfer)"
    )
    baseline = models.TextField(
        help_text="Current functional baseline (e.g. Requires moderate assist of 1 person)"
    )
    target = models.TextField(
        help_text="Target measurable outcome (e.g. Independent transfer without assistive device)"
    )
    expected_completion_date = models.DateField(
        help_text="Target milestone completion date"
    )
    status = models.CharField(
        max_length=20,
        choices=GoalStatus.choices,
        default=GoalStatus.NOT_STARTED
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_goals'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['expected_completion_date', '-created_at']
        verbose_name = 'Rehabilitation Goal'
        verbose_name_plural = 'Rehabilitation Goals'

    def __str__(self):
        return f"[{self.get_category_display()}] {self.description} ({self.get_status_display()})"

