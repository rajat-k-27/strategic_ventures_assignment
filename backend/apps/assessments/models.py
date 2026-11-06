from django.db import models
from django.utils import timezone
from django.conf import settings
from apps.patients.models import Patient

class BalanceRisk(models.TextChoices):
    LOW = 'LOW', 'Low Fall Risk'
    MODERATE = 'MODERATE', 'Moderate Fall Risk'
    HIGH = 'HIGH', 'High Fall Risk'

class ClinicalAssessment(models.Model):
    """
    Detailed baseline or progress clinical evaluation of patient functional capacity.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    assessor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_assessments'
    )
    assessment_date = models.DateField(default=timezone.now)

    # 1. Functional Mobility
    mobility_score = models.PositiveSmallIntegerField(
        help_text="Functional Mobility Independence Score (1: Total Assist, 5: Independent)",
        default=3
    )
    assistive_device = models.CharField(
        max_length=100,
        blank=True,
        default='None',
        help_text="e.g. Standard Cane, Quad Cane, Wheeled Walker, Wheelchair"
    )
    mobility_notes = models.TextField(
        help_text="Detailed mobility findings (transfers, gait distance, endurance, posture)"
    )

    # 2. Balance Findings
    balance_score = models.PositiveSmallIntegerField(
        help_text="Berg Balance Scale equivalent (0-56 scale or 1-5 standardized scale)",
        default=28
    )
    balance_risk = models.CharField(
        max_length=20,
        choices=BalanceRisk.choices,
        default=BalanceRisk.MODERATE
    )
    balance_notes = models.TextField(
        help_text="Sitting vs standing balance, Romberg, perturbations, anticipatory control"
    )

    # 3. Upper Limb Findings
    upper_limb_strength_left = models.CharField(max_length=20, default='4/5')
    upper_limb_strength_right = models.CharField(max_length=20, default='5/5')
    upper_limb_notes = models.TextField(
        help_text="Active ROM, motor control, spasticity (Ashworth), dexterity, subluxation"
    )

    # 4. Lower Limb Findings
    lower_limb_strength_left = models.CharField(max_length=20, default='3/5')
    lower_limb_strength_right = models.CharField(max_length=20, default='5/5')
    lower_limb_notes = models.TextField(
        help_text="Weight-bearing capacity, ankle dorsiflexion, knee stability, clonus"
    )

    # General Clinical Summary & Precautions
    clinical_summary = models.TextField(
        help_text="Overall assessment summary, primary deficits identified, and rehabilitation potential"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assessment_date', '-created_at']
        verbose_name = 'Clinical Assessment'
        verbose_name_plural = 'Clinical Assessments'

    def __str__(self):
        return f"Assessment for {self.patient.full_name} ({self.assessment_date})"

