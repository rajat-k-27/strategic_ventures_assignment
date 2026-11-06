from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import UserRole
from apps.patients.models import Patient, Gender, PatientStatus
from apps.assessments.models import ClinicalAssessment, BalanceRisk
from apps.goals.models import RehabilitationGoal, GoalCategory, GoalStatus
from apps.raps.models import RehabilitationActionPlan, RAPStatus, RAPVersion

User = get_user_model()

class RAPWorkflowTests(TestCase):
    """
    Comprehensive tests for Rehabilitation Action Plan workflow,
    state transitions, version history preservation, and role-based access.
    """
    def setUp(self):
        self.client = APIClient()
        self.today = date.today()

        # Create Clinician
        self.clinician = User.objects.create_user(
            username='dr_rajesh',
            password='password123',
            role=UserRole.CLINICIAN,
            first_name='Rajesh',
            last_name='Sharma'
        )

        # Create Supervisor
        self.supervisor = User.objects.create_user(
            username='dr_vikram',
            password='password123',
            role=UserRole.SUPERVISOR,
            first_name='Vikram',
            last_name='Malhotra'
        )

        # Create Patient
        self.patient = Patient.objects.create(
            first_name='Rohan',
            last_name='Gupta',
            date_of_birth=date(self.today.year - 50, self.today.month, self.today.day),
            gender=Gender.MALE,
            primary_diagnosis='Right Knee ACL Reconstruction',
            admission_date=self.today,
            created_by=self.clinician
        )

        # Create Assessment
        self.assessment = ClinicalAssessment.objects.create(
            patient=self.patient,
            assessor=self.clinician,
            assessment_date=self.today,
            mobility_score=3,
            mobility_notes='Ambulates 20m with hemi-walker',
            balance_score=30,
            balance_risk=BalanceRisk.MODERATE,
            balance_notes='Moderate fall risk during turns',
            upper_limb_strength_left='3/5',
            upper_limb_strength_right='5/5',
            upper_limb_notes='Left wrist extension reduced',
            lower_limb_strength_left='3+/5',
            lower_limb_strength_right='5/5',
            lower_limb_notes='Left ankle dorsiflexion weak',
            clinical_summary='Good rehab potential'
        )

        # Create Goals
        self.goal1 = RehabilitationGoal.objects.create(
            patient=self.patient,
            category=GoalCategory.MOBILITY,
            description='Independent transfers from bed to chair',
            baseline='Requires assist x1',
            target='Independent transfer without cueing',
            expected_completion_date=self.today + timedelta(days=30),
            created_by=self.clinician
        )
        self.goal2 = RehabilitationGoal.objects.create(
            patient=self.patient,
            category=GoalCategory.BALANCE,
            description='Dynamic standing balance improvement',
            baseline='Berg score 30/56',
            target='Berg score >= 45/56',
            expected_completion_date=self.today + timedelta(days=30),
            created_by=self.clinician
        )

    def test_patient_id_auto_generated(self):
        """Verify unique patient ID format PAT-YYYYMMDD-XXX"""
        self.assertTrue(self.patient.patient_id.startswith('PAT-'))
        self.assertEqual(self.patient.full_name, 'Rohan Gupta')
        self.assertEqual(self.patient.age, 50)

    def test_rap_creation_and_id_generation(self):
        """Verify RAP creation generates unique RAP ID and initial version snapshot"""
        self.client.force_authenticate(user=self.clinician)
        response = self.client.post('/api/raps/', {
            'patient': self.patient.id,
            'assessment': self.assessment.id,
            'goals': [self.goal1.id, self.goal2.id],
            'title': 'Stroke Recovery Plan Phase 1',
            'clinical_summary': 'Comprehensive physical therapy 5 days/week',
            'duration_weeks': 6,
            'target_review_date': str(self.today + timedelta(days=42)),
            'submit_now': False
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        rap = RehabilitationActionPlan.objects.get(id=response.data['id'])
        self.assertTrue(rap.rap_id.startswith('RAP-'))
        self.assertEqual(rap.status, RAPStatus.DRAFT)
        self.assertEqual(rap.version, 1)
        self.assertEqual(rap.versions.count(), 1)
        self.assertEqual(rap.versions.first().action, 'DRAFT_SAVED')

    def test_workflow_draft_to_submitted_to_approved(self):
        """
        Verify happy path: DRAFT -> SUBMITTED -> APPROVED.
        """
        rap = RehabilitationActionPlan.objects.create(
            patient=self.patient,
            assessment=self.assessment,
            title='Test Plan',
            clinical_summary='Test Summary',
            duration_weeks=6,
            target_review_date=self.today + timedelta(days=42),
            status=RAPStatus.DRAFT,
            created_by=self.clinician
        )
        rap.goals.set([self.goal1, self.goal2])

        # Clinician submits
        self.client.force_authenticate(user=self.clinician)
        submit_res = self.client.post(f'/api/raps/{rap.id}/submit/')
        self.assertEqual(submit_res.status_code, status.HTTP_200_OK)
        rap.refresh_from_db()
        self.assertEqual(rap.status, RAPStatus.SUBMITTED)
        self.assertIsNotNone(rap.submitted_at)
        self.assertEqual(rap.submitted_by, self.clinician)

        # Supervisor approves
        self.client.force_authenticate(user=self.supervisor)
        approve_res = self.client.post(f'/api/raps/{rap.id}/approve/', {
            'comments': 'Plan targets are clinical sound. Approved.'
        })
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        rap.refresh_from_db()
        self.assertEqual(rap.status, RAPStatus.APPROVED)
        self.assertEqual(rap.reviewed_by, self.supervisor)
        self.assertIn('clinical sound', rap.approval_comments)

    def test_workflow_return_and_revision_preserves_versions(self):
        """
        Verify revision path: SUBMITTED -> RETURNED -> REVISED -> SUBMITTED,
        ensuring version increments and past snapshots are preserved!
        """
        rap = RehabilitationActionPlan.objects.create(
            patient=self.patient,
            assessment=self.assessment,
            title='Revision Plan',
            clinical_summary='Summary v1',
            duration_weeks=6,
            target_review_date=self.today + timedelta(days=42),
            status=RAPStatus.SUBMITTED,
            version=1,
            created_by=self.clinician,
            submitted_by=self.clinician
        )
        rap.goals.set([self.goal1])
        rap.record_version_snapshot(action='SUBMITTED', performed_by=self.clinician)

        # Supervisor returns plan with comments
        self.client.force_authenticate(user=self.supervisor)
        return_res = self.client.post(f'/api/raps/{rap.id}/return_plan/', {
            'comments': 'Please include a balance goal before approving.'
        })
        self.assertEqual(return_res.status_code, status.HTTP_200_OK)
        rap.refresh_from_db()
        self.assertEqual(rap.status, RAPStatus.RETURNED)
        self.assertEqual(rap.approval_comments, 'Please include a balance goal before approving.')

        # Clinician updates returned plan (adding second goal)
        self.client.force_authenticate(user=self.clinician)
        update_res = self.client.put(f'/api/raps/{rap.id}/', {
            'patient': self.patient.id,
            'assessment': self.assessment.id,
            'goals': [self.goal1.id, self.goal2.id],
            'title': 'Revision Plan Updated',
            'clinical_summary': 'Summary updated with balance targets',
            'duration_weeks': 6,
            'target_review_date': str(self.today + timedelta(days=42)),
            'submit_now': True
        })
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        rap.refresh_from_db()

        # Check version incremented to 2 and status moved back to SUBMITTED
        self.assertEqual(rap.version, 2)
        self.assertEqual(rap.status, RAPStatus.SUBMITTED)

        # Verify version history snapshots preserved
        versions = rap.versions.all().order_by('created_at')
        actions = [v.action for v in versions]
        self.assertIn('SUBMITTED', actions)
        self.assertIn('RETURNED', actions)
        self.assertIn('REVISED', actions)

        # Check that Version 1 snapshot captured 1 goal and Version 2 has 2 goals
        v1 = rap.versions.filter(version_number=1, action='SUBMITTED').first()
        self.assertEqual(len(v1.snapshot['goals']), 1)

    def test_permission_clinician_cannot_approve(self):
        """Verify role-based security: Clinicians cannot approve RAPs"""
        rap = RehabilitationActionPlan.objects.create(
            patient=self.patient,
            assessment=self.assessment,
            title='Security Test Plan',
            clinical_summary='Test',
            duration_weeks=6,
            target_review_date=self.today + timedelta(days=42),
            status=RAPStatus.SUBMITTED,
            created_by=self.clinician
        )
        rap.goals.set([self.goal1])

        self.client.force_authenticate(user=self.clinician)
        approve_res = self.client.post(f'/api/raps/{rap.id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_return_without_comments_fails(self):
        """Verify business rule: Returning requires mandatory comments"""
        rap = RehabilitationActionPlan.objects.create(
            patient=self.patient,
            assessment=self.assessment,
            title='Validation Plan',
            clinical_summary='Test',
            duration_weeks=6,
            target_review_date=self.today + timedelta(days=42),
            status=RAPStatus.SUBMITTED,
            created_by=self.clinician
        )
        rap.goals.set([self.goal1])

        self.client.force_authenticate(user=self.supervisor)
        return_res = self.client.post(f'/api/raps/{rap.id}/return_plan/', {'comments': ''})
        self.assertEqual(return_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_permission_supervisor_cannot_submit(self):
        """Verify role-based security: Supervisors cannot submit clinician plans"""
        rap = RehabilitationActionPlan.objects.create(
            patient=self.patient,
            assessment=self.assessment,
            title='Supervisor Submit Test',
            clinical_summary='Test',
            duration_weeks=4,
            target_review_date=self.today + timedelta(days=28),
            status=RAPStatus.DRAFT,
            created_by=self.clinician
        )
        rap.goals.set([self.goal1])

        self.client.force_authenticate(user=self.supervisor)
        submit_res = self.client.post(f'/api/raps/{rap.id}/submit/')
        self.assertEqual(submit_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_permission_supervisor_cannot_edit(self):
        """Verify role-based security: Supervisors cannot edit/revise clinical plans"""
        rap = RehabilitationActionPlan.objects.create(
            patient=self.patient,
            assessment=self.assessment,
            title='Supervisor Edit Test',
            clinical_summary='Test',
            duration_weeks=4,
            target_review_date=self.today + timedelta(days=28),
            status=RAPStatus.RETURNED,
            created_by=self.clinician
        )
        rap.goals.set([self.goal1])

        self.client.force_authenticate(user=self.supervisor)
        edit_res = self.client.put(f'/api/raps/{rap.id}/', {
            'patient': self.patient.id,
            'assessment': self.assessment.id,
            'goals': [self.goal1.id],
            'title': 'Supervisor Tried To Edit',
            'clinical_summary': 'Unauthorized update',
            'duration_weeks': 4,
            'target_review_date': str(self.today + timedelta(days=28)),
            'submit_now': False
        })
        self.assertEqual(edit_res.status_code, status.HTTP_403_FORBIDDEN)
