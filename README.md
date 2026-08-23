# 🏢 SocioSphere — Society Maintenance & Complaint Management System

<div align="center">

![SocioSphere Banner](screenshots/Landing%20Page.png)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Alembic-1.12+-green?style=for-the-badge)](https://alembic.sqlalchemy.org/)
[![Pytest](https://img.shields.io/badge/Pytest-36%20Passed-4B8BBE?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**An enterprise-grade, full-stack residential society maintenance, complaint ticketing, SLA tracking, and community broadcast platform.**

[Explore Features](#-key-features) • [System Architecture](#-system-architecture) • [Demo Credentials](#-pre-seeded-demo-credentials) • [Quickstart Guide](#-quickstart-guide) • [API Reference](#-api-endpoints--documentation)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Visual Showcase](#-visual-showcase)
- [Key Features](#-key-features)
- [Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
- [System Architecture](#-system-architecture)
  - [High-Level Architecture Pipeline](#high-level-architecture-pipeline)
  - [Complaint Lifecycle State Machine](#complaint-lifecycle-state-machine)
  - [Database Entity-Relationship (ER) Schema](#database-entity-relationship-er-schema)
- [Tech Stack](#-tech-stack)
- [Quickstart Guide](#-quickstart-guide)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables Reference](#-environment-variables-reference)
- [API Endpoints & Documentation](#-api-endpoints--documentation)
- [Automated Testing Suite](#-automated-testing-suite)
- [Repository Structure](#-repository-structure)
- [License](#-license)

---

## 🌟 Overview

**SocioSphere** modernizes housing society operations by replacing disorganized messaging groups and paper logbooks with a structured, transparent, and auditable digital workflow.

Designed with a **dark-mode aesthetic**, 3D interactive hero animations (Three.js), and role-based workflows, SocioSphere empowers:
- **Residents** to submit maintenance requests with photo proof, track live status transitions with immutable vertical timeline logs, and stay informed through pinned announcements.
- **Administrators & Facility Managers** to oversee community tickets, track SLA overdue boundaries with configurable thresholds, filter complaints dynamically, update statuses with administrative audit notes, broadcast society notices, and dispatch automated background email alerts.

---

## 📸 Visual Showcase

<div align="center">

### 1. 3D Interactive Landing Page
*Features custom Three.js architectural wireframes, smooth Lenis scrolling, problem vs. solution comparisons, interactive tabs, and live dashboard previews.*

![Landing Page](screenshots/Landing%20Page.png)

---

### 2. Administrator Command Center
*Real-time KPI metric cards with smooth counter animations, interactive Recharts distribution charts, SLA overdue alerts, multi-criteria filtering, and work order management.*

![Admin Panel](screenshots/Admin%20Panel.png)

---

### 3. Resident Service Portal
*One-click ticket lodging with photo attachments, live vertical progression history timeline, status badges, and prioritized society notices.*

![Resident Panel](screenshots/Resident%20Panel.png)

</div>

---

## 🔑 Pre-Seeded Demo Credentials

The database comes pre-populated with realistic historical data, active tickets across all categories, overdue SLA records, and sample notices.

| Role | Portal / User | Email Address | Password | Flat / Unit |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | **Society Secretary** | `admin@society.com` | `adminpassword123` | Clubhouse Office |
| **Resident** | **Alice Resident** | `resident@society.com` | `residentpassword123` | Flat A-402 |
| **Resident** | **Nikhil Agrawal** | `agnikhil9897@gmail.com` | `residentpassword123` | Flat B-304 |
| **Resident** | **Rahul Sharma** | `rahul.sharma@society.com` | `residentpassword123` | Flat A-102 |
| **Resident** | **Priya Patel** | `priya.patel@society.com` | `residentpassword123` | Flat B-201 |
| **Resident** | **Vikram Mehta** | `vikram.mehta@society.com` | `residentpassword123` | Flat C-104 |
| **Resident** | **Sunita Rao** | `sunita.rao@society.com` | `residentpassword123` | Flat D-305 |
| **Resident** | **Kavita Singh** | `kavita.singh@society.com` | `residentpassword123` | Flat C-502 |
| **Resident** | **Arjun Nair** | `arjun.nair@society.com` | `residentpassword123` | Flat B-601 |

> [!TIP]
> **Admin Privileges:** You can also promote any registered resident account to Administrator directly in the database by updating `role = 'admin'` in the `users` table.

---

## 🚀 Key Features

### 👤 For Residents
- **Streamlined Ticket Submission**: Lodge complaints categorized by **Plumbing**, **Electrical**, **Cleanliness**, **Security**, **Parking**, and **Other** with optional photo attachments (JPG, PNG, WebP up to 5MB).
- **Live Status Progression Timeline**: Track maintenance milestones through an immutable vertical audit trail (`Open` ➔ `In Progress` ➔ `Resolved`) with staff notes and exact timestamps.
- **Overdue SLA Visibility**: Clear visual indicators when a ticket exceeds the society's SLA resolution threshold.
- **Digital Notice Board**: Instant access to emergency notices and community circulars with high-visibility priority pinning (`is_important`).

### 🛡️ For Administrators
- **Executive Analytics & KPI Dashboard**: Real-time aggregation of total volume, status distributions, category breakdowns, and overdue tallies.
- **Dynamic Multi-Criteria Filtering**: Filter complaints simultaneously by category, status, date ranges, and urgency with backend pagination and automatic overdue-first sorting.
- **Configurable Overdue SLA Engine**: Modify the society resolution threshold (default: 7 days) via runtime settings without requiring backend restarts or migrations.
- **Audit-Logged Status Updates**: Transition ticket statuses, assign field technicians, append resolution notes, and adjust priority levels (`Low`, `Medium`, `High`).
- **Broadcast Notices & Automated Email Alerts**: Publish society-wide circulars with automated background email delivery (`FastAPI BackgroundTasks` + SMTP/SendGrid) for important announcements and ticket status updates.

---

## 🏗️ System Architecture

### High-Level Architecture Pipeline

```mermaid
flowchart TB
    subgraph Client["Frontend Layer (React 18 + Vite + TypeScript)"]
        Landing["3D Landing Page\n(Three.js + Lenis + Lucide)"]
        AuthContext["Auth Context & Axios Interceptors\n(JWT Bearer Injection)"]
        AdminView["Admin Command Center\n(Recharts + KPI Counters + Multi-filter)"]
        ResidentView["Resident Portal\n(Ticket Lodging + Vertical Timelines)"]
    end

    subgraph API["Backend API Gateway (FastAPI)"]
        RouterAuth["/auth (Login / Register / Me)"]
        RouterComplaints["/complaints (CRUD & Timeline)"]
        RouterAdmin["/admin (Dashboard / Filters / SLA Settings)"]
        RouterNotices["/notices (Board & Pinned Broadcasts)"]
        StorageEngine["Multi-Backend Storage\n(Local Disk / Cloudinary CDN)"]
    end

    subgraph Background["Async Background Worker Layer"]
        BackgroundTasks["FastAPI BackgroundTasks Queue"]
        EmailService["SMTP / SendGrid Email Dispatcher"]
        EmailLogger["Email Audit Logger (email_logs)"]
    end

    subgraph Database["Persistence Layer (SQLAlchemy 2.0 + Alembic)"]
        DB[(PostgreSQL / SQLite)]
        UsersTable["users"]
        ComplaintsTable["complaints"]
        HistoryTable["complaint_status_history"]
        NoticesTable["notices"]
        SettingsTable["app_settings"]
        LogsTable["email_logs"]
    end

    Client -->|HTTP/REST + JWT| API
    RouterAuth --> DB
    RouterComplaints --> DB
    RouterAdmin --> DB
    RouterNotices --> DB
    RouterComplaints --> StorageEngine
    RouterComplaints -.->|Async Trigger| BackgroundTasks
    RouterNotices -.->|Async Trigger| BackgroundTasks
    BackgroundTasks --> EmailService
    EmailService --> EmailLogger
    EmailLogger --> LogsTable
```

---

### Complaint Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Open : Resident Lodges Complaint (Photo + Description)
    
    Open --> In_Progress : Admin Assigns Technician / Approves Work Order
    Open --> Overdue : Exceeds SLA Threshold (Created_at > Overdue_Days)
    
    Overdue --> In_Progress : Priority Escalation & Technician Dispatched
    
    In_Progress --> Resolved : Maintenance Completed & Admin Notes Added
    In_Progress --> Overdue : Delay in Parts / SLA Exceeded
    
    Resolved --> [*] : Email Notification Sent & Audit History Sealed
```

---

### Database Entity-Relationship (ER) Schema

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "raises"
    USERS ||--o{ COMPLAINT_STATUS_HISTORY : "updates"
    USERS ||--o{ NOTICES : "publishes"
    COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : "tracks"
    COMPLAINTS ||--o{ EMAIL_LOGS : "triggers"
    NOTICES ||--o{ EMAIL_LOGS : "broadcasts"

    USERS {
        int id PK
        string email UK "Unique email address"
        string name "Full resident / admin name"
        string hashed_password "Bcrypt salted hash"
        enum role "resident | admin"
        string flat_no "Assigned flat or office"
        datetime created_at "Registration timestamp"
    }

    COMPLAINTS {
        int id PK
        int resident_id FK "References users.id"
        enum category "Plumbing | Electrical | Cleanliness | Security | Parking | Other"
        text description "Detailed issue narrative"
        string photo_url "Static upload or Cloudinary URL"
        enum status "Open | In Progress | Resolved"
        enum priority "Low | Medium | High"
        datetime created_at "Lodged timestamp"
        datetime resolved_at "Resolution timestamp"
        datetime updated_at "Last updated timestamp"
    }

    COMPLAINT_STATUS_HISTORY {
        int id PK
        int complaint_id FK "References complaints.id"
        enum old_status "Previous status"
        enum new_status "Updated status"
        int changed_by FK "References users.id"
        text note "Administrative / Technician note"
        datetime changed_at "Timestamp of status update"
    }

    NOTICES {
        int id PK
        string title "Announcement headline"
        text body "Notice content"
        boolean is_important "Priority pinning flag"
        int posted_by FK "References users.id"
        datetime created_at "Publish timestamp"
    }

    APP_SETTINGS {
        string key PK "e.g. overdue_threshold_days"
        string value "e.g. 7"
        string description "Configuration explanation"
        datetime updated_at "Last modified timestamp"
    }

    EMAIL_LOGS {
        int id PK
        string to_email "Recipient email address"
        string subject "Email subject header"
        int related_complaint_id FK "Optional complaint reference"
        int related_notice_id FK "Optional notice reference"
        string status "sent | failed"
        text error_message "Failure trace if applicable"
        datetime sent_at "Dispatch timestamp"
    }
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), Custom Design System (HSL tokens, Glassmorphism, Modern typography)
- **3D Graphics & Animations**: [Three.js](https://threejs.org/), [Framer Motion](https://www.framer.com/motion/), [Lenis Smooth Scroll](https://lenis.darkroom.engineering/)
- **Charts & Data Viz**: [Recharts](https://recharts.org/) (Interactive Donut & Bar Charts)
- **Icons & Notifications**: [Lucide React](https://lucide.dev/), [React Hot Toast](https://react-hot-toast.com/)
- **HTTP Client**: Axios with automated bearer token interception and 401 redirect handling

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) with Pydantic v2 validation
- **ORM & Migrations**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
- **Database**: PostgreSQL (Production) / SQLite (Local development & test suite)
- **Authentication**: OAuth2 Password Flow with JWT (`python-jose`, `passlib` bcrypt)
- **Storage Backend**: Multi-engine photo storage (Local disk static server & Cloudinary SDK)
- **Background Tasks**: FastAPI `BackgroundTasks` with resilient `smtplib` (Gmail App Passwords & SendGrid TLS)
- **Testing**: `pytest` & `pytest-asyncio` with 100% test pass rate

---

## 💻 Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10 or higher (`python --version`)
- **Node.js**: 18.x or higher & npm (`node --version`, `npm --version`)
- **Database**: Local SQLite (configured by default) or PostgreSQL

---

### 2. Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create environment configuration
cp .env.example .env

# 5. Apply Alembic database migrations
alembic upgrade head

# 6. Seed demo & historical data
python app/scripts/seed_demo.py

# 7. Start the FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be running at **`http://localhost:8000`**.

---

### 3. Frontend Setup

```bash
# 1. Open a new terminal and navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional, defaults to http://localhost:8000)
cp .env.example .env

# 4. Start the Vite development server
npm run dev
```

Frontend application will be live at **`http://localhost:5173`**.

---

### 4. Building for Production

```bash
# Frontend production bundle
cd frontend
npm run build

# Output will be generated under frontend/dist/
```

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :---: |
| `DATABASE_URL` | Database connection string | `sqlite:///./society_db.db` | Yes |
| `JWT_SECRET` | Secret key for signing authentication tokens | `your_super_secret_jwt_key` | Yes |
| `JWT_ALGORITHM` | Cryptographic algorithm for JWT | `HS256` | Yes |
| `JWT_EXPIRE_MINUTES`| JWT session validity duration | `60` | Yes |
| `OVERDUE_THRESHOLD_DAYS` | Default days before an unresolved ticket turns overdue | `7` | No |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` | Yes |
| `STORAGE_BACKEND` | Photo upload storage provider (`local` or `cloudinary`) | `local` | Yes |
| `UPLOAD_DIR` | Directory for local file storage | `uploads` | No |
| `CLOUDINARY_URL` | Cloudinary credentials URL | `cloudinary://key:secret@cloud` | If Cloudinary |
| `SMTP_HOST` | Outgoing SMTP email host | `smtp.gmail.com` | No |
| `SMTP_PORT` | Outgoing SMTP STARTTLS port | `587` | No |
| `SMTP_USER` | SMTP username / sender email | `your_email@gmail.com` | No |
| `SMTP_PASSWORD` | SMTP password / 16-character App Password | `your_app_password` | No |

### Frontend (`frontend/.env`)

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :---: |
| `VITE_API_URL` | Base backend API endpoint URL | `http://localhost:8000` | Yes |

---

## 📡 API Endpoints & Documentation

FastAPI automatically serves interactive API playgrounds at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Reference**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema (JSON)**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### Core Endpoints Matrix

| Module | Method | Endpoint | Access | Description |
| :--- | :---: | :--- | :---: | :--- |
| **Auth** | `POST` | `/auth/register` | Public | Register a new resident account |
| **Auth** | `POST` | `/auth/login` | Public | Authenticate user and obtain JWT access token |
| **Auth** | `GET` | `/auth/me` | Authenticated | Fetch currently logged-in user profile & role |
| **Complaints**| `POST` | `/complaints` | Resident | Lodge a new complaint with optional photo upload |
| **Complaints**| `GET` | `/complaints/my` | Resident | Fetch all complaints raised by the logged-in resident |
| **Complaints**| `GET` | `/complaints/{id}` | Authenticated | Retrieve complaint details, photo, and status history |
| **Admin** | `GET` | `/admin/dashboard` | Admin Only | Get aggregate dashboard metrics & category charts |
| **Admin** | `GET` | `/admin/complaints` | Admin Only | Get all complaints with multi-criteria filters & pagination |
| **Admin** | `PATCH`| `/complaints/{id}/status` | Admin Only | Update ticket status (`Open`, `In Progress`, `Resolved`) |
| **Admin** | `PATCH`| `/complaints/{id}/priority`| Admin Only | Update ticket priority (`Low`, `Medium`, `High`) |
| **Admin** | `GET` | `/admin/settings` | Admin Only | Fetch runtime system settings (SLA overdue threshold) |
| **Admin** | `PATCH`| `/admin/settings` | Admin Only | Update SLA overdue threshold days dynamically |
| **Notices** | `GET` | `/notices` | Authenticated | Fetch notices sorted by pinned importance (`is_important`) |
| **Notices** | `POST` | `/notices` | Admin Only | Publish a new notice and trigger resident email broadcast |
| **Health** | `GET` | `/health` | Public | System uptime & service health probe |

---

## 🧪 Automated Testing Suite

The backend contains a comprehensive test suite covering authentication, RBAC boundaries, SLA overdue detection, notice pinning, and email background tasks with a **100% pass rate**.

```bash
cd backend
pytest -v
```

### Test Suite Execution Output
```text
tests/test_admin_complaints.py::test_admin_settings_get_and_patch PASSED        [  2%]
tests/test_admin_complaints.py::test_overdue_detection_open_vs_resolved PASSED  [  5%]
tests/test_admin_complaints.py::test_admin_complaints_filtering PASSED          [  8%]
tests/test_admin_complaints.py::test_admin_complaints_overdue_first_sorting PASSED [ 11%]
tests/test_admin_complaints.py::test_admin_priority_update PASSED               [ 13%]
tests/test_admin_complaints.py::test_non_admin_forbidden_on_all_admin_routes PASSED [ 16%]
tests/test_admin_complaints.py::test_admin_dashboard_aggregation PASSED         [ 19%]
tests/test_admin_complaints.py::test_overdue_threshold_boundary_precision PASSED[ 22%]
tests/test_auth.py::test_register_user_success PASSED                           [ 25%]
tests/test_auth.py::test_register_duplicate_email PASSED                        [ 27%]
tests/test_auth.py::test_login_success_and_failure PASSED                       [ 30%]
tests/test_auth.py::test_get_me_endpoint PASSED                                 [ 33%]
tests/test_auth.py::test_role_based_access_control PASSED                       [ 36%]
tests/test_auth.py::test_register_multiple_admins_forbidden PASSED              [ 38%]
tests/test_complaints.py::test_create_complaint_without_photo PASSED            [ 41%]
tests/test_complaints.py::test_create_complaint_with_valid_photo PASSED         [ 44%]
tests/test_complaints.py::test_create_complaint_invalid_category_rejected PASSED[ 47%]
tests/test_complaints.py::test_create_complaint_short_description_rejected PASSED[ 50%]
tests/test_complaints.py::test_create_complaint_invalid_file_type_rejected PASSED[ 52%]
tests/test_complaints.py::test_create_complaint_oversized_file_rejected PASSED  [ 55%]
tests/test_complaints.py::test_get_my_complaints_list PASSED                    [ 58%]
tests/test_complaints.py::test_resident_cannot_see_other_resident_complaint PASSED [ 61%]
tests/test_complaints.py::test_admin_can_access_any_complaint PASSED            [ 63%]
tests/test_complaints.py::test_admin_cannot_create_resident_complaint PASSED    [ 66%]
tests/test_complaints.py::test_complaint_status_lifecycle_and_history_sequence PASSED [ 69%]
tests/test_complaints.py::test_invalid_status_transitions PASSED                [ 72%]
tests/test_complaints.py::test_invalid_status_value_rejected_with_422 PASSED    [ 75%]
tests/test_complaints.py::test_resident_cannot_update_complaint_status PASSED   [ 77%]
tests/test_email_notifications.py::test_email_sent_on_complaint_status_change PASSED [ 80%]
tests/test_email_notifications.py::test_email_sent_for_all_residents_on_important_notice PASSED [ 83%]
tests/test_email_notifications.py::test_email_not_sent_on_regular_notice PASSED [ 86%]
tests/test_email_notifications.py::test_email_failure_does_not_crash_request PASSED [ 88%]
tests/test_notices.py::test_admin_can_create_notice PASSED                      [ 91%]
tests/test_notices.py::test_resident_cannot_create_notice PASSED                [ 94%]
tests/test_notices.py::test_notices_pinning_order PASSED                        [ 97%]
tests/test_notices.py::test_unauthenticated_access_to_notices PASSED            [100%]

============================= 36 passed in 85.38s ==============================
```

---

## 📁 Repository Structure

```text
society-maintenance-tracker/
├── backend/
│   ├── alembic/                  # Database migration scripts & environment
│   │   └── versions/             # Entity migration revisions
│   ├── app/
│   │   ├── core/                 # App configuration, database session, JWT security
│   │   ├── models/               # SQLAlchemy ORM models (User, Complaint, Notice, History, etc.)
│   │   ├── routers/              # FastAPI endpoint routers (auth, complaints, admin, notices)
│   │   ├── schemas/              # Pydantic v2 validation schemas & DTOs
│   │   ├── scripts/              # Seed scripts (seed_demo.py with historical dataset)
│   │   └── services/             # Storage service, email dispatch, settings manager
│   ├── tests/                    # Pytest automated test suite (36 tests)
│   ├── uploads/                  # Local media upload storage directory
│   ├── requirements.txt          # Python backend dependencies
│   └── society_db.db             # Local SQLite database
├── frontend/
│   ├── public/                   # Public static assets & favicons
│   ├── src/
│   │   ├── api/                  # Axios HTTP API client & interceptors
│   │   ├── components/           # Reusable UI components (Modals, Timelines, Badges, 3D Hero)
│   │   ├── context/              # Authentication context & provider
│   │   ├── pages/                # Page views (Landing, AdminDashboard, ResidentDashboard, Auth)
│   │   ├── types/                # TypeScript interface and enum declarations
│   │   ├── App.tsx               # Route configurations & protected route guards
│   │   ├── index.css             # Tailwind CSS tokens & custom styling
│   │   └── main.tsx              # Application entry point
│   ├── package.json              # Frontend dependencies and npm scripts
│   ├── tailwind.config.js        # Tailwind design system configuration
│   └── vite.config.ts            # Vite bundler configuration
├── screenshots/                  # Project UI captures for documentation
│   ├── Landing Page.png          # 3D interactive landing page screenshot
│   ├── Admin Panel.png           # Administrator dashboard screenshot
│   └── Resident Panel.png        # Resident portal screenshot
├── docs/                         # Additional documentation
├── .gitignore                    # Git ignore definitions
└── README.md                     # Comprehensive project documentation
```

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Engineered with precision for modern residential housing societies. Developed by <b>Nikhil Agrawal</b>.</sub>
</div>
