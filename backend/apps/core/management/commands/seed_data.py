from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.authentication.models import UserRole
from apps.patients.models import Patient, Gender, PatientStatus
from apps.assessments.models import ClinicalAssessment, BalanceRisk
from apps.goals.models import RehabilitationGoal, GoalCategory, GoalStatus
from apps.raps.models import RehabilitationActionPlan, RAPStatus

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds database with realistic synthetic clinical rehabilitation data."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("==> Seeding users and roles..."))

        # 1. Clinician User (Physiotherapist)
        clinician, _ = User.objects.get_or_create(
            username="clinician",
            defaults={
                "email": "rajesh.sharma@rehab.in",
                "first_name": "Rajesh",
                "last_name": "Sharma",
                "role": UserRole.CLINICIAN,
                "title": "Senior Physiotherapist (MPT)",
                "license_number": "PT-4821",
                "is_staff": False,
            }
        )
        clinician.first_name = "Rajesh"
        clinician.last_name = "Sharma"
        clinician.title = "Senior Physiotherapist (MPT)"
        clinician.email = "rajesh.sharma@rehab.in"
        clinician.set_password("password123")
        clinician.save()

        # 2. Clinical Supervisor User (Lead Doctor / Reviewer)
        supervisor, _ = User.objects.get_or_create(
            username="supervisor",
            defaults={
                "email": "vikram.malhotra@rehab.in",
                "first_name": "Vikram",
                "last_name": "Malhotra",
                "role": UserRole.SUPERVISOR,
                "title": "Lead Physiatrist & Clinical Supervisor (MD)",
                "license_number": "MD-8920",
                "is_staff": True,
            }
        )
        supervisor.first_name = "Vikram"
        supervisor.last_name = "Malhotra"
        supervisor.title = "Lead Physiatrist & Clinical Supervisor (MD)"
        supervisor.email = "vikram.malhotra@rehab.in"
        supervisor.set_password("password123")
        supervisor.save()

        # 3. Administrator
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@rehab.in",
                "first_name": "Admin",
                "last_name": "User",
                "role": UserRole.ADMIN,
                "title": "Hospital Admin",
                "is_staff": True,
                "is_superuser": True,
            }
        )
        admin_user.set_password("password123")
        admin_user.save()

        self.stdout.write(self.style.SUCCESS("  Users created: clinician (Dr. Rajesh Sharma), supervisor (Dr. Vikram Malhotra), admin (password: 'password123')"))

        # Clean prior synthetic data to ensure idempotent seed
        self.stdout.write(self.style.NOTICE("==> Resetting clinical data with realistic Indian patient profiles..."))
        RehabilitationActionPlan.objects.all().delete()
        RehabilitationGoal.objects.all().delete()
        ClinicalAssessment.objects.all().delete()
        Patient.objects.all().delete()

        today = date.today()

        # -------------------------------------------------------------
        # Patient 1: Amit Patel (Post-Op ACL Knee Ligament Rehab - Approved RAP with version history)
        # -------------------------------------------------------------
        p1 = Patient.objects.create(
            first_name="Amit",
            last_name="Patel",
            date_of_birth=today - timedelta(days=42 * 365),
            gender=Gender.MALE,
            contact_phone="+91 98201 44521",
            contact_email="amit.patel@example.com",
            address="Flat 402, Shanti Heights, Andheri East, Mumbai",
            primary_diagnosis="Right Knee ACL Reconstruction (Post-Operative)",
            secondary_diagnosis="Mild hypertension, sedentary desk job",
            admission_date=today - timedelta(days=21),
            status=PatientStatus.ACTIVE,
            created_by=clinician,
        )

        a1 = ClinicalAssessment.objects.create(
            patient=p1,
            assessor=clinician,
            assessment_date=today - timedelta(days=20),
            mobility_score=3,
            assistive_device="Knee Brace & Single Elbow Crutch",
            mobility_notes="Patient is 3 weeks post-surgery. Walking with single crutch and hinged knee brace. Knee bending currently limited to 85 degrees due to stiffness and mild swelling.",
            balance_score=34,
            balance_risk=BalanceRisk.MODERATE,
            balance_notes="Moderate balance while standing. Needs caution when turning and walking on uneven surfaces.",
            upper_limb_strength_left="5/5",
            upper_limb_strength_right="5/5",
            upper_limb_notes="Normal arm and grip strength bilaterally.",
            lower_limb_strength_left="5/5",
            lower_limb_strength_right="3+/5",
            lower_limb_notes="Right thigh quadriceps weakness; left leg normal strength.",
            clinical_summary="Motivated patient. Immediate goals are reducing knee swelling, increasing knee flexion range, and progressing to independent walking without crutches.",
        )

        g1_1 = RehabilitationGoal.objects.create(
            patient=p1,
            category=GoalCategory.MOBILITY,
            description="Walk 100 meters independently without crutches",
            baseline="Requires single elbow crutch and knee brace for walking beyond 20 meters",
            target="Walk 100 meters smoothly with normal gait pattern without crutches",
            expected_completion_date=today + timedelta(days=28),
            status=GoalStatus.IN_PROGRESS,
            created_by=clinician,
        )
        g1_2 = RehabilitationGoal.objects.create(
            patient=p1,
            category=GoalCategory.LOWER_LIMB,
            description="Achieve 110-degree knee flexion (bending)",
            baseline="Current active knee flexion restricted to 85 degrees",
            target="Active knee flexion to 110 degrees without sharp pain",
            expected_completion_date=today + timedelta(days=21),
            status=GoalStatus.IN_PROGRESS,
            created_by=clinician,
        )
        g1_3 = RehabilitationGoal.objects.create(
            patient=p1,
            category=GoalCategory.ADL,
            description="Independent stair climbing with handrail support",
            baseline="Cannot climb stairs step-over-step; leads with good leg only",
            target="Climb one flight of 12 stairs safely using handrail support",
            expected_completion_date=today + timedelta(days=35),
            status=GoalStatus.IN_PROGRESS,
            created_by=clinician,
        )

        # RAP 1: APPROVED plan with version history (DRAFT -> SUBMITTED -> RETURNED -> REVISED -> APPROVED)
        rap1 = RehabilitationActionPlan.objects.create(
            patient=p1,
            assessment=a1,
            title="Knee ACL Post-Operative Recovery Plan - Phase 2",
            clinical_summary="Physical therapy sessions 4 days/week focusing on quadriceps strengthening, stationary cycling, knee range of motion exercises, and gradual weaning off crutches.",
            duration_weeks=6,
            target_review_date=today + timedelta(days=35),
            status=RAPStatus.APPROVED,
            version=2,
            approval_comments="Revisions look practical and safe. Stair climbing target and flexion goals are well balanced. Approved for 6 weeks.",
            created_by=clinician,
            submitted_by=clinician,
            reviewed_by=supervisor,
            submitted_at=timezone.now() - timedelta(days=16),
            reviewed_at=timezone.now() - timedelta(days=14),
        )
        rap1.goals.set([g1_1, g1_2, g1_3])

        # Version History for RAP 1
        rap1.record_version_snapshot(
            action="DRAFT_SAVED",
            performed_by=clinician,
            comments="Initial ACL recovery plan drafted."
        )
        rap1.record_version_snapshot(
            action="SUBMITTED",
            performed_by=clinician,
            comments="Submitted plan to Dr. Vikram Malhotra."
        )
        rap1.record_version_snapshot(
            action="RETURNED",
            performed_by=supervisor,
            comments="Please reduce duration from 8 weeks to 6 weeks for mid-term review and clarify stair climbing precautions."
        )
        rap1.record_version_snapshot(
            action="REVISED",
            performed_by=clinician,
            comments="Updated timeline to 6 weeks and added handrail support in stair climbing goal. Upgraded to Version 2."
        )
        rap1.record_version_snapshot(
            action="APPROVED",
            performed_by=supervisor,
            comments="Revisions look practical and safe. Stair climbing target and flexion goals are well balanced. Approved for 6 weeks."
        )

        # -------------------------------------------------------------
        # Patient 2: Sunita Sharma (Stroke Recovery - SUBMITTED RAP ready for Supervisor to review)
        # -------------------------------------------------------------
        p2 = Patient.objects.create(
            first_name="Sunita",
            last_name="Sharma",
            date_of_birth=today - timedelta(days=61 * 365),
            gender=Gender.FEMALE,
            contact_phone="+91 97110 33892",
            contact_email="sunita.sharma@example.com",
            address="B-14, Sector 62, Noida, Uttar Pradesh",
            primary_diagnosis="Stroke Recovery with Right-Sided Mild Weakness",
            secondary_diagnosis="History of high blood pressure, controlled on medication",
            admission_date=today - timedelta(days=7),
            status=PatientStatus.ACTIVE,
            created_by=clinician,
        )

        a2 = ClinicalAssessment.objects.create(
            patient=p2,
            assessor=clinician,
            assessment_date=today - timedelta(days=5),
            mobility_score=3,
            assistive_device="Walker",
            mobility_notes="Patient can walk 20 meters with a walker under therapist supervision. Gets tired easily. Right arm movement is present but slow.",
            balance_score=26,
            balance_risk=BalanceRisk.HIGH,
            balance_notes="Standing balance is unsteady when turning. High fall risk if walking unattended.",
            upper_limb_strength_left="5/5",
            upper_limb_strength_right="3/5",
            upper_limb_notes="Right shoulder and elbow have moderate movement; wrist grip is slightly weak.",
            lower_limb_strength_left="5/5",
            lower_limb_strength_right="3/5",
            lower_limb_notes="Right leg feels heavy while lifting foot; walks with small steps.",
            clinical_summary="Good recovery potential. Needs balance training, sit-to-stand practice, and gentle gait training with family supervision.",
        )

        g2_1 = RehabilitationGoal.objects.create(
            patient=p2,
            category=GoalCategory.MOBILITY,
            description="Independent sit-to-stand transfer from chair",
            baseline="Requires assistance of 1 person to stand up from chair",
            target="Stand up independently from a standard chair without hand pulling",
            expected_completion_date=today + timedelta(days=21),
            status=GoalStatus.IN_PROGRESS,
            created_by=clinician,
        )
        g2_2 = RehabilitationGoal.objects.create(
            patient=p2,
            category=GoalCategory.BALANCE,
            description="Walk 40 meters safely with a walking stick",
            baseline="Requires walker and therapist support for walking 15 meters",
            target="Walk 40 meters with single walking stick under supervision",
            expected_completion_date=today + timedelta(days=35),
            status=GoalStatus.IN_PROGRESS,
            created_by=clinician,
        )

        rap2 = RehabilitationActionPlan.objects.create(
            patient=p2,
            assessment=a2,
            title="Post-Stroke Mobility & Balance Restoration Plan",
            clinical_summary="30-minute daily exercises focusing on transfer safety, weight shifting, stepping balance, and right arm functional reach drills.",
            duration_weeks=6,
            target_review_date=today + timedelta(days=30),
            status=RAPStatus.SUBMITTED,
            version=1,
            created_by=clinician,
            submitted_by=clinician,
            submitted_at=timezone.now() - timedelta(hours=3),
        )
        rap2.goals.set([g2_1, g2_2])
        rap2.record_version_snapshot(
            action="DRAFT_SAVED",
            performed_by=clinician,
            comments="Initial stroke rehabilitation draft."
        )
        rap2.record_version_snapshot(
            action="SUBMITTED",
            performed_by=clinician,
            comments="Submitted plan for clinical review by Dr. Vikram Malhotra."
        )

        # -------------------------------------------------------------
        # Patient 3: Rahul Verma (Lower Back Slip Disc - RETURNED RAP ready for Clinician Revision)
        # -------------------------------------------------------------
        p3 = Patient.objects.create(
            first_name="Rahul",
            last_name="Verma",
            date_of_birth=today - timedelta(days=34 * 365),
            gender=Gender.MALE,
            contact_phone="+91 99882 11094",
            contact_email="rahul.verma@example.com",
            address="Flat 203, Green Glen Layout, Bellandur, Bengaluru",
            primary_diagnosis="Lower Back Disc Bulge with Sciatica",
            secondary_diagnosis="Long sitting hours (software developer), sedentary lifestyle",
            admission_date=today - timedelta(days=10),
            status=PatientStatus.ACTIVE,
            created_by=clinician,
        )

        a3 = ClinicalAssessment.objects.create(
            patient=p3,
            assessor=clinician,
            assessment_date=today - timedelta(days=9),
            mobility_score=4,
            assistive_device="None",
            mobility_notes="Walking is normal. Sharp pain in lower back radiating down left leg when sitting for more than 20 minutes.",
            balance_score=48,
            balance_risk=BalanceRisk.LOW,
            balance_notes="Balance is good and stable. Pain increases on forward spinal flexion.",
            upper_limb_strength_left="5/5",
            upper_limb_strength_right="5/5",
            upper_limb_notes="Normal upper body strength.",
            lower_limb_strength_left="4/5",
            lower_limb_strength_right="5/5",
            lower_limb_notes="Mild hamstring tightness on left side with mild numbness in left calf.",
            clinical_summary="Acute phase passing into subacute. Focus on core muscle stabilization, ergonomic workstation corrections, and McKenzie back extensions.",
        )

        g3_1 = RehabilitationGoal.objects.create(
            patient=p3,
            category=GoalCategory.ADL,
            description="Sit comfortably for 45 minutes without back pain",
            baseline="Cannot sit continuously for more than 15-20 minutes without back ache",
            target="Sit pain-free for 45 minutes using ergonomic lumbar roll support",
            expected_completion_date=today + timedelta(days=21),
            status=GoalStatus.IN_PROGRESS,
            created_by=clinician,
        )
        g3_2 = RehabilitationGoal.objects.create(
            patient=p3,
            category=GoalCategory.MOBILITY,
            description="Brisk walk 2 kilometers continuously without leg numbness",
            baseline="Pain starts after 10-12 minutes of slow walking",
            target="Walk 2 km continuously at brisk pace with zero sciatica symptoms",
            expected_completion_date=today + timedelta(days=28),
            status=GoalStatus.IN_PROGRESS,
            created_by=clinician,
        )

        rap3 = RehabilitationActionPlan.objects.create(
            patient=p3,
            assessment=a3,
            title="Lumbar Spine Rehabilitation & Core Strengthening Plan",
            clinical_summary="Therapy 3 days a week: pelvic tilts, bird-dog exercises, gentle hamstring stretches, and posture awareness training.",
            duration_weeks=4,
            target_review_date=today + timedelta(days=25),
            status=RAPStatus.RETURNED,
            version=1,
            approval_comments="Please add specific instructions about desk posture breaks every 30 minutes and include a core plank endurance target.",
            created_by=clinician,
            submitted_by=clinician,
            reviewed_by=supervisor,
            submitted_at=timezone.now() - timedelta(days=1),
            reviewed_at=timezone.now() - timedelta(hours=5),
        )
        rap3.goals.set([g3_1, g3_2])
        rap3.record_version_snapshot(
            action="DRAFT_SAVED",
            performed_by=clinician,
            comments="Initial spine rehab plan draft."
        )
        rap3.record_version_snapshot(
            action="SUBMITTED",
            performed_by=clinician,
            comments="Submitted for supervisor review."
        )
        rap3.record_version_snapshot(
            action="RETURNED",
            performed_by=supervisor,
            comments="Please add specific instructions about desk posture breaks every 30 minutes and include a core plank endurance target."
        )

        # -------------------------------------------------------------
        # Patient 4: Meera Deshmukh (Frozen Shoulder - DRAFT RAP in progress)
        # -------------------------------------------------------------
        p4 = Patient.objects.create(
            first_name="Meera",
            last_name="Deshmukh",
            date_of_birth=today - timedelta(days=53 * 365),
            gender=Gender.FEMALE,
            contact_phone="+91 98230 77102",
            contact_email="meera.deshmukh@example.com",
            address="Bungalow 5, Model Colony, Shivajinagar, Pune",
            primary_diagnosis="Left Frozen Shoulder (Adhesive Capsulitis)",
            secondary_diagnosis="Type 2 diabetes (known factor for frozen shoulder), well managed",
            admission_date=today - timedelta(days=2),
            status=PatientStatus.ACTIVE,
            created_by=clinician,
        )

        a4 = ClinicalAssessment.objects.create(
            patient=p4,
            assessor=clinician,
            assessment_date=today - timedelta(days=1),
            mobility_score=5,
            assistive_device="None",
            mobility_notes="Walking and general mobility fully independent. Restricted solely to left shoulder joint.",
            balance_score=52,
            balance_risk=BalanceRisk.LOW,
            balance_notes="Normal balance and gait.",
            upper_limb_strength_left="3+/5",
            upper_limb_strength_right="5/5",
            upper_limb_notes="Severe left shoulder stiffness. Unable to lift arm above shoulder level (elevation limited to 90 degrees). Reaching behind back is painful.",
            lower_limb_strength_left="5/5",
            lower_limb_strength_right="5/5",
            lower_limb_notes="Normal lower limbs.",
            clinical_summary="Freezing stage of adhesive capsulitis. Priority is gentle joint mobilization, pulley exercises, and pain management with hot packs.",
        )

        g4_1 = RehabilitationGoal.objects.create(
            patient=p4,
            category=GoalCategory.UPPER_LIMB,
            description="Raise left arm overhead to 135 degrees",
            baseline="Current active elevation is 90 degrees with pain",
            target="Reach 135 degrees overhead reach smoothly without pain",
            expected_completion_date=today + timedelta(days=35),
            status=GoalStatus.NOT_STARTED,
            created_by=clinician,
        )

        rap4 = RehabilitationActionPlan.objects.create(
            patient=p4,
            assessment=a4,
            title="Frozen Shoulder Joint Mobilization & Home Exercise Plan",
            clinical_summary="Shoulder wheel, finger ladder exercises, pulley stretching, and home pendulum exercises 3 times daily.",
            duration_weeks=6,
            target_review_date=today + timedelta(days=40),
            status=RAPStatus.DRAFT,
            version=1,
            created_by=clinician,
        )
        rap4.goals.set([g4_1])
        rap4.record_version_snapshot(
            action="DRAFT_SAVED",
            performed_by=clinician,
            comments="Initial draft created for frozen shoulder rehab."
        )

        # -------------------------------------------------------------
        # Patient 5: Vikram Joshi (Ankle Ligament Sprain - DRAFT RAP)
        # -------------------------------------------------------------
        p5 = Patient.objects.create(
            first_name="Vikram",
            last_name="Joshi",
            date_of_birth=today - timedelta(days=29 * 365),
            gender=Gender.MALE,
            contact_phone="+91 97654 33210",
            contact_email="vikram.joshi@example.com",
            address="Flat 204, Ganga Skies, Viman Nagar, Pune",
            primary_diagnosis="Right Ankle Inversion Sprain (Grade 2 Ligament Tear)",
            secondary_diagnosis="Recreational badminton player, no prior fractures",
            admission_date=today - timedelta(days=3),
            status=PatientStatus.ACTIVE,
            created_by=clinician,
        )

        a5 = ClinicalAssessment.objects.create(
            patient=p5,
            assessor=clinician,
            assessment_date=today - timedelta(days=2),
            mobility_score=4,
            assistive_device="Ankle Brace",
            mobility_notes="Walking with mild limp. Ankle swelling significantly reduced after RICE protocol. Ankle inversion and plantarflexion slightly painful at end-ranges.",
            balance_score=40,
            balance_risk=BalanceRisk.MODERATE,
            balance_notes="Can stand on two feet easily. Single-leg standing on injured right foot is shaky (holds for only 8 seconds before losing balance).",
            upper_limb_strength_left="5/5",
            upper_limb_strength_right="5/5",
            upper_limb_notes="Normal upper limb function.",
            lower_limb_strength_left="5/5",
            lower_limb_strength_right="4/5",
            lower_limb_notes="Right peroneus and calf muscles slightly inhibited due to pain. Left leg normal.",
            clinical_summary="Young athletic patient recovering from sports ankle sprain. Primary focus is ankle stability, proprioception (balance), and gradual return to running.",
        )

        g5_1 = RehabilitationGoal.objects.create(
            patient=p5,
            category=GoalCategory.BALANCE,
            description="Right single-leg balance for 30 seconds on wobble board",
            baseline="Can maintain single leg balance for only 8 seconds on flat floor",
            target="Maintain stable single leg balance for 30 seconds on foam pad/wobble board",
            expected_completion_date=today + timedelta(days=21),
            status=GoalStatus.NOT_STARTED,
            created_by=clinician,
        )
        g5_2 = RehabilitationGoal.objects.create(
            patient=p5,
            category=GoalCategory.LOWER_LIMB,
            description="Perform 20 single-leg heel raises without pain",
            baseline="Able to do 6 repetitions before fatigue and lateral ankle discomfort",
            target="Complete 20 repetitions smoothly with full calf extension",
            expected_completion_date=today + timedelta(days=28),
            status=GoalStatus.NOT_STARTED,
            created_by=clinician,
        )

        rap5 = RehabilitationActionPlan.objects.create(
            patient=p5,
            assessment=a5,
            title="Right Ankle Proprioception & Sports Reconditioning Plan",
            clinical_summary="Theraband resistance exercises for eversion/dorsiflexion, wobble board balance drills, calf eccentrics, and agility ladder drills 4 days weekly.",
            duration_weeks=4,
            target_review_date=today + timedelta(days=28),
            status=RAPStatus.DRAFT,
            version=1,
            created_by=clinician,
        )
        rap5.goals.set([g5_1, g5_2])
        rap5.record_version_snapshot(
            action="DRAFT_SAVED",
            performed_by=clinician,
            comments="Initial rehabilitation action plan draft created by Dr. Rajesh Sharma."
        )

        self.stdout.write(self.style.SUCCESS("==> Successfully seeded realistic Indian patients, assessments, goals, and RAPs!"))
