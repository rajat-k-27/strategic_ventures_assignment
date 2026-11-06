from rest_framework import permissions
from .models import UserRole

class IsClinician(permissions.BasePermission):
    """
    Allows access only to Clinicians or Superusers.
    """
    message = "Only clinicians and therapists are authorized to perform this clinical action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == UserRole.CLINICIAN or request.user.is_superuser)
        )

class IsSupervisor(permissions.BasePermission):
    """
    Allows access only to Supervisors, Reviewers, or Superusers.
    """
    message = "Approval and return actions require Clinical Supervisor authorization."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == UserRole.SUPERVISOR or request.user.is_superuser)
        )

class IsClinicianOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access to all authenticated users, write access to clinicians.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == UserRole.CLINICIAN or request.user.is_superuser

