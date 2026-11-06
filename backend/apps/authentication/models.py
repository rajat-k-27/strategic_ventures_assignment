from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    CLINICIAN = 'CLINICIAN', 'Clinician / Therapist'
    SUPERVISOR = 'SUPERVISOR', 'Clinical Supervisor / Reviewer'
    ADMIN = 'ADMIN', 'System Administrator'

class User(AbstractUser):
    """
    Custom user model supporting role-based access control for rehabilitation workflow.
    """
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CLINICIAN,
        help_text="Determines authorization permissions across the RAP approval workflow."
    )
    title = models.CharField(
        max_length=100,
        blank=True,
        help_text="Professional title, e.g. Senior Physical Therapist, Lead Physiatrist"
    )
    license_number = models.CharField(
        max_length=50,
        blank=True,
        help_text="Clinical medical/therapy registration identifier"
    )

    class Meta:
        ordering = ['last_name', 'first_name']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    @property
    def is_clinician(self) -> bool:
        return self.role == UserRole.CLINICIAN or self.is_superuser

    @property
    def is_supervisor(self) -> bool:
        return self.role == UserRole.SUPERVISOR or self.is_superuser

    def __str__(self):
        full_name = self.get_full_name()
        display = full_name if full_name else self.username
        return f"{display} ({self.get_role_display()})"

