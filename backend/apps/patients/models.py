from datetime import date
import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings

class Gender(models.TextChoices):
    MALE = 'MALE', 'Male'
    FEMALE = 'FEMALE', 'Female'
    OTHER = 'OTHER', 'Other'
    PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY', 'Prefer not to say'

class PatientStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active Rehabilitation'
    DISCHARGED = 'DISCHARGED', 'Discharged'
    ON_HOLD = 'ON_HOLD', 'Medical Hold'

class Patient(models.Model):
    """
    Patient master record storing demographic and diagnosis details.
    """
    patient_id = models.CharField(
        max_length=32,
        unique=True,
        editable=False,
        db_index=True,
        help_text="Unique auto-generated identifier, e.g. PAT-20241105-001"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.MALE)
    contact_phone = models.CharField(max_length=30, blank=True)
    contact_email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    # Clinical diagnosis
    primary_diagnosis = models.CharField(
        max_length=255,
        help_text="Primary condition requiring rehabilitation (e.g. Ischemic Stroke, Hip Fracture)"
    )
    secondary_diagnosis = models.TextField(
        blank=True,
        help_text="Secondary comorbidities, precautions, or past medical history"
    )
    admission_date = models.DateField(default=timezone.now)
    status = models.CharField(
        max_length=20,
        choices=PatientStatus.choices,
        default=PatientStatus.ACTIVE
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registered_patients'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'

    def save(self, *args, **kwargs):
        if not self.patient_id:
            today_str = timezone.now().strftime('%Y%m%d')
            # Generate sequential count for today
            count_today = Patient.objects.filter(
                patient_id__startswith=f"PAT-{today_str}"
            ).count() + 1
            self.patient_id = f"PAT-{today_str}-{count_today:03d}"
        super().save(*args, **kwargs)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def age(self) -> int:
        if not self.date_of_birth:
            return 0
        today = date.today()
        return (
            today.year - self.date_of_birth.year -
            ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )

    def __str__(self):
        return f"{self.patient_id} - {self.full_name}"

