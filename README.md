# Rehabilitation Action Plan (RAP) Management

> **Full Stack Developer - Technical Assessment**  
> Mini full-stack healthcare application managing patient clinical rehabilitation, measurable goals, and supervised approval workflows with immutable version history.

---

## 1. System Overview & Architecture

This application is built to model a realistic rehabilitation department workflow. It provides an end-to-end clinical pipeline connecting **Patient Intake**, **Functional Assessment**, **Milestone Goal Setting**, and **Rehabilitation Action Plan (RAP) Approval & Revision Governance**.

```
[ Patient Registration ]  ──>  [ Clinical Assessment ]  ──>  [ Measurable Goals ]
         │                               │                               │
         └───────────────────────────────┴───────────────────────────────┘
                                         │
                                         ▼
                            [ Action Plan (RAP) Engine ]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
              (Clinician)                                (Supervisor)
             DRAFT Plan                               Review Queue
                 │                                         │
                 ▼                                         ▼
             SUBMITTED  ─────────────────────────────>  APPROVED
                 ▲                                         │
                 │              RETURNED                   │
                 └─── REVISED  <──────── (with comments) ──┘
                    (v2, v3...)
```

### Core Architectural Decisions (Human-Engineered)
- **Domain-Driven Modular Apps**: Instead of a monolithic `views.py` or `models.py`, the backend is decoupled into focused domain apps (`patients`, `assessments`, `goals`, `raps`, `authentication`, `core`).
- **Immutable Version History & Audit Trail**: Every status transition (`DRAFT_SAVED`, `SUBMITTED`, `RETURNED`, `REVISED`, `APPROVED`) generates a permanent snapshot in `RAPVersion` storing serialized assessment data, goal snapshots, supervisor feedback, timestamp, and author ID. Previous plan versions are never lost or overwritten.
- **Strict State Machine Validation**: Model methods (`submit_plan()`, `approve_plan()`, `return_plan()`, `revise_plan()`) validate transitions and prevent illegal jumps (e.g. approving a draft, returning without comments, or modifying an already approved plan).
- **Role-Based Access Control (RBAC)**: Custom DRF permissions enforce that only Clinicians/Therapists can author and revise plans, while only Clinical Supervisors can approve or return plans.
- **Evaluation Role Switcher**: A 1-click persona switcher in the navigation bar allows reviewers to switch between **Dr. Rajesh Sharma (Clinician)** and **Dr. Vikram Malhotra (Supervisor)** instantly to test both perspectives without repeated logins.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite + TypeScript | Type-safe, modular, reactive single page application |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Clean, responsive clinical dashboard styling |
| **Backend** | Python 3.12 + Django REST Framework 5.1 | RESTful API, serializers, model methods, and custom permissions |
| **Database** | PostgreSQL 16 (with SQLite fallback) | Relational integrity, foreign keys, JSONField snapshot storage |
| **Authentication** | JWT (`rest_framework_simplejwt`) | Token-based auth with user roles and claims |
| **Containerization** | Docker & Docker Compose | Multi-container reproducible deployment |

---

## 3. Quick Start Guide

### Option A: 1-Command Startup (Recommended)
The repository includes a ready-to-use launch script that checks prerequisites, starts PostgreSQL, runs migrations, seeds synthetic clinical data, and boots both frontend and backend:

```bash
chmod +x scripts/run_dev.sh
./scripts/run_dev.sh
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API & Admin**: `http://localhost:8000`

---

### Option B: Docker Compose
Run the entire stack with Docker:

```bash
docker compose up --build
```

Access the frontend at `http://localhost:5173`.

---

### Option C: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start local PostgreSQL or specify DATABASE_URL in .env
# Default: postgresql://postgres@localhost:5435/rehab_db

python manage.py makemigrations
python manage.py migrate
python manage.py seed_data
python manage.py runserver 127.0.0.1:8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 4. Test Accounts & Personas

The database is seeded with realistic healthcare credentials:

| Role | Username | Password | Persona & Privileges |
|---|---|---|---|
| **Clinician** | `clinician` | `password123` | **Dr. Rajesh Sharma (PT)**: Registers patients, conducts assessments, creates goals, drafts RAPs, submits for review, revises returned plans. |
| **Clinical Supervisor** | `supervisor` | `password123` | **Dr. Vikram Malhotra (MD, Lead Physiatrist)**: Inspects pending RAPs, writes approval remarks, approves plans, returns plans with feedback. |
| **Admin** | `admin` | `password123` | Full superuser administrative access. |

> **Pro Tip**: Use the **Persona Pill** in the top navbar to switch roles in a single click during your assessment demo!

---

## 5. Functional Screens & Verification

### 1. Patient Dashboard (`/`)
- KPI Analytics: Total Patients, Pending Approvals, Returned Plans, Approved RAPs.
- Patient search and status filtering.
- Patient records showing unique `patient_id` (format: `PAT-YYYYMMDD-XXX`), primary diagnosis, and current RAP status.
- **Clinical Summary Modal**: Clicking the eye icon displays complete patient history (all assessments, goals, and RAPs in one dialog).

### 2. Patient Registration (`/patients/register`)
- Demographic intake: First/Last Name, DOB, Gender, Phone, Email, Residential Address.
- Clinical details: Admission Date, Status, Primary Diagnosis, Secondary Comorbidities.
- Auto-generates sequential Patient ID upon saving.

### 3. Clinical Assessment (`/assessments`)
- Patient Selector with live diagnosis banner.
- Standardized functional evaluation sections:
  1. **Functional Mobility**: 1-5 Independence scale, assistive device, transfer & ambulation notes.
  2. **Balance Findings**: Berg Balance Scale score, Fall Risk classification (`LOW`, `MODERATE`, `HIGH`).
  3. **Upper Limb Findings**: Left/Right strength (e.g. `4/5`, `5/5`), ROM & dexterity notes.
  4. **Lower Limb Findings**: Left/Right strength, weight bearing & gait notes.
  5. **Overall Clinical Summary**: Prognosis and precautions.
- Assessment History drawer displaying all historical records for the patient.

### 4. Goal Management (`/goals`)
- Category filters: Functional Mobility, Balance & Posture, Upper Limb, Lower Limb, ADL, Cognitive.
- Status filters: Not Started, In Progress, Achieved.
- Visual Goal Cards contrasting **Baseline Functional Level** vs **Measurable Target Outcome** with expected completion date.
- Modal to create new patient goals.

### 5. RAP Generation (`/raps/create`)
- Synthesizes patient profile, baseline clinical assessment, and multiple selectable goals.
- Captures Plan Title, Clinical Intervention Summary, Duration in weeks, and Target Review Date.
- Dual action buttons:
  - **Save as Draft**: Sets status to `DRAFT` for continued authoring.
  - **Submit for Supervisor Review**: Sets status to `SUBMITTED`, locks draft, and notifies supervisor.

### 6. RAP Approval Dashboard (`/approvals`)
- Status filter tabs: **Pending Review (SUBMITTED)**, **Returned for Revision**, **Approved**, **Drafts**, **All Plans**.
- Interactive Review Drawer:
  - Comprehensive breakdown of Patient, Baseline Assessment, and Associated Goals.
  - **Preserved Version History Timeline**: Displays full audit log of transitions, who performed each action, timestamp, and comments.
  - **Snapshot Inspector**: Expandable snapshot viewer showing historical plan data at each revision.
  - **Supervisor Controls**: When viewing a `SUBMITTED` plan, supervisor can **Approve** or **Return for Revision** (requires mandatory explanation comments).
  - **Clinician Revision Studio**: When viewing a `RETURNED` plan, clinician can click **Revise & Upgrade Version** to adjust parameters, address feedback, and re-submit (automatically advancing version from `v1` to `v2`).

---

## 6. Automated Backend Test Suite

The project includes unit and integration tests covering:
- Auto-generation of Patient IDs and RAP IDs.
- Full approval cycle: `DRAFT` → `SUBMITTED` → `APPROVED`.
- Full return & revision cycle: `SUBMITTED` → `RETURNED` → `REVISED` → `SUBMITTED`.
- Version snapshot preservation across multiple revisions.
- Role-based permissions (clinicians forbidden from approving; supervisors forbidden from submitting/editing drafts).
- Mandatory return comment validation.

Run the test suite:

```bash
cd backend
./venv/bin/python manage.py test apps.raps
```

Expected output:
```
Found 8 test(s).
Creating test database for alias 'default'...
........
----------------------------------------------------------------------
Ran 8 tests in ~6s

OK
Destroying test database for alias 'default'...
```

---

## 7. API Specification Reference

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `POST` | `/api/auth/login/` | JWT token login (returns user profile + roles) | Public |
| `GET` | `/api/auth/me/` | Fetch authenticated user details | Authenticated |
| `GET` | `/api/dashboard/stats/` | KPI analytics for clinical operations | Authenticated |
| `GET` | `/api/patients/` | List patients with search & filtering | Authenticated |
| `POST` | `/api/patients/` | Register new patient (generates `patient_id`) | Clinician / Staff |
| `GET` | `/api/patients/{id}/summary/` | Unified clinical history (assessments, goals, RAPs) | Authenticated |
| `GET` | `/api/assessments/` | List assessments (filter by `?patient=`) | Authenticated |
| `POST` | `/api/assessments/` | Record new clinical assessment | Clinician / Staff |
| `GET` | `/api/goals/` | List patient goals (filter by `?patient=`, `?category=`) | Authenticated |
| `POST` | `/api/goals/` | Create measurable rehabilitation goal | Clinician / Staff |
| `PATCH` | `/api/goals/{id}/` | Update goal status or targets | Clinician / Staff |
| `GET` | `/api/raps/` | List RAPs (filter by `?status=`, `?patient=`) | Authenticated |
| `POST` | `/api/raps/` | Create RAP (with assessment and goals) | Clinician / Staff |
| `GET` | `/api/raps/{id}/` | Full RAP detail with versions and snapshots | Authenticated |
| `POST` | `/api/raps/{id}/submit/` | Transition: `DRAFT`/`REVISED` → `SUBMITTED` | Clinician / Owner |
| `POST` | `/api/raps/{id}/approve/` | Transition: `SUBMITTED` → `APPROVED` | **Supervisor Only** |
| `POST` | `/api/raps/{id}/return_plan/` | Transition: `SUBMITTED` → `RETURNED` (requires comment) | **Supervisor Only** |
| `GET` | `/api/raps/{id}/versions/` | Retrieve complete version history & audit trail | Authenticated |

