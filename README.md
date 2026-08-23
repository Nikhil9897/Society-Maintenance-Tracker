# Society Maintenance & Complaint Tracker

**Society Maintenance & Complaint Tracker** is a full-stack web application designed for residential housing societies and gated communities to streamline maintenance operations, complaint ticketing, audit logging, emergency notice broadcasting, and administrative oversight. Residents can effortlessly lodge complaints with photo attachments, monitor live status progressions via vertical timeline history, and review pinned announcements, while administrators manage work orders with automated overdue detection, configurable SLAs, aggregate analytics, and background email alerts.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ORM & Migrations**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
- **Database**: PostgreSQL (Production) / SQLite (Local development & test suite)
- **Authentication**: OAuth2 Password Flow with JWT (`python-jose`, `passlib` bcrypt)
- **Background Tasks & Notifications**: FastAPI `BackgroundTasks`, `smtplib` (Gmail App Passwords & SendGrid TLS support)
- **Storage**: Multi-backend image upload service (Local disk static storage & Cloudinary)
- **Testing**: `pytest` & `pytest-asyncio` with 100% test pass rate

### Frontend
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing & State**: [React Router v6](https://reactrouter.com/), Context API, Axios Interceptors
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons & Feedback**: [Lucide React](https://lucide.dev/), [React Hot Toast](https://react-hot-toast.com/)

---

## 🚀 Local Setup Guide

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher & npm
- **Database**: PostgreSQL or local SQLite (default)

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

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env

# 5. Run database migrations
alembic upgrade head

# 6. Seed demo data (creates admin & sample tickets)
python app/scripts/seed_demo.py

# 7. Start the FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be running at **`http://localhost:8000`**.

---

### 3. Frontend Setup

```bash
# 1. Open a new terminal and navigate to the frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The frontend will be live at **`http://localhost:5173`**.

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the `backend/` directory referencing `.env.example`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy database connection string | `sqlite:///./society_db.db` or `postgresql://user:pass@localhost:5432/society_db` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | `your_jwt_secret_key_here` |
| `JWT_ALGORITHM` | Cryptographic algorithm for JWT | `HS256` |
| `JWT_EXPIRE_MINUTES` | Token validity duration in minutes | `60` |
| `OVERDUE_THRESHOLD_DAYS` | Default days before unresolved complaints turn overdue | `7` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `STORAGE_BACKEND` | Photo storage engine (`local` or `cloudinary`) | `local` |
| `UPLOAD_DIR` | Local storage folder for uploaded photos | `uploads` |
| `CLOUDINARY_URL` | Cloudinary connection URL (if using Cloudinary) | `cloudinary://api_key:api_secret@cloud_name` |
| `SMTP_HOST` | Outgoing SMTP email server | `smtp.gmail.com` or `smtp.sendgrid.net` |
| `SMTP_PORT` | Outgoing SMTP port (STARTTLS) | `587` |
| `SMTP_USER` | SMTP username / Gmail address | `your_email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password / 16-char Gmail App Password | `your_16_char_app_password` |

---

## 📖 Interactive API Documentation

Once the backend is running, explore and test the interactive API docs:

- **Swagger UI (Interactive Playground)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc (Human-readable Reference)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Specification (JSON)**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 🗄️ Database Architecture & Schema

The database model is built around six normalized entities:

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "raises"
    USERS ||--o{ COMPLAINT_STATUS_HISTORY : "updates"
    USERS ||--o{ NOTICES : "posts"
    COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : "tracks"
    COMPLAINTS ||--o{ EMAIL_LOGS : "logs"
    NOTICES ||--o{ EMAIL_LOGS : "logs"

    USERS {
        int id PK
        string email UK
        string name
        string hashed_password
        enum role "resident | admin"
        datetime created_at
    }

    COMPLAINTS {
        int id PK
        int resident_id FK
        enum category "Plumbing | Electrical | Cleanliness | Security | Parking | Other"
        text description
        string photo_url
        enum status "Open | In Progress | Resolved"
        enum priority "Low | Medium | High"
        datetime created_at
        datetime resolved_at
        datetime updated_at
    }

    COMPLAINT_STATUS_HISTORY {
        int id PK
        int complaint_id FK
        enum old_status
        enum new_status
        int changed_by FK
        text note
        datetime changed_at
    }

    NOTICES {
        int id PK
        string title
        text body
        boolean is_important
        int posted_by FK
        datetime created_at
    }

    APP_SETTINGS {
        string key PK
        string value
        string description
        datetime updated_at
    }

    EMAIL_LOGS {
        int id PK
        string to_email
        string subject
        int related_complaint_id FK
        int related_notice_id FK
        string status "sent | failed"
        text error_message
        datetime sent_at
    }
```

### Table Summary
1. **`users`**: Resident and Administrator credentials, roles, and profile information.
2. **`complaints`**: Core maintenance tickets with category, description, photo link, status, and priority.
3. **`complaint_status_history`**: Immutable audit trail of every status transition (`Open -> In Progress -> Resolved`), responsible user, and administrative notes.
4. **`notices`**: Society-wide broadcast announcements with `is_important` priority pinning.
5. **`app_settings`**: Runtime key-value configuration table (e.g. `overdue_threshold_days`).
6. **`email_logs`**: Complete audit records of all background email notifications and status alerts.

---

## 👥 Seed & Demo Accounts

### Automated Seeding
Run the seeding script to populate the database with an administrator, sample resident, notices, and tickets:

```bash
cd backend
python app/scripts/seed_demo.py
```

### Pre-seeded Demo Credentials
- **Administrator Portal**:
  - **Email**: `admin@society.com`
  - **Password**: `adminpassword123`
- **Resident Portal**:
  - **Email**: `resident@society.com`
  - **Password**: `residentpassword123`

### Manual Promotion of Any User to Admin
If you register a new user through the registration form and wish to promote them to Administrator manually in the database:

```sql
-- Connect to SQLite / PostgreSQL and run:
UPDATE users SET role = 'admin' WHERE email = 'your_registered_email@example.com';
```

---

## 🧪 Running the Test Suite

Execute the full automated pytest suite covering authentication, RBAC, complaint lifecycle, overdue threshold boundaries, notice pinning, dashboard aggregations, and email triggers:

```bash
cd backend
pytest -v
```

**Test Results Summary**:
```text
tests/test_admin_complaints.py .......... [ 28%]
tests/test_auth.py ..................... [ 48%]
tests/test_complaints.py ................ [ 77%]
tests/test_email_notifications.py ....... [ 88%]
tests/test_notices.py ................... [100%]

======================= 35 passed, 1 warning in 31.19s ========================
```

---

## 🏗️ Production Frontend Build

To build the optimized static production bundle:

```bash
cd frontend
npm run build
```

The output bundle is generated under `frontend/dist/`.
