"""
URL configuration for the Rehabilitation Action Plan Management system.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.patients.views import PatientViewSet
from apps.assessments.views import ClinicalAssessmentViewSet
from apps.goals.views import RehabilitationGoalViewSet
from apps.raps.views import RehabilitationActionPlanViewSet
from apps.core.views import DashboardStatsView

# Central DRF Router
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'assessments', ClinicalAssessmentViewSet, basename='assessment')
router.register(r'goals', RehabilitationGoalViewSet, basename='goal')
router.register(r'raps', RehabilitationActionPlanViewSet, basename='rap')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/', include(router.urls)),
]

