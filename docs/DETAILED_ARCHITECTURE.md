# PostCare AI — Detailed Architecture Diagram
## Every Step, Every Page, Every API Hit

---

# 1. Application Entry & Auth Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION ENTRY POINT                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    index.html → main.jsx → App.jsx
                              │
                              ├── ThemeProvider (wraps all)
                              ├── AuthProvider (wraps all)
                              │       │
                              │       └── On mount: if token exists
                              │           └── GET /api/auth/me  ←─────────────────────────────┐
                              │               (AuthContext.jsx)                                 │
                              │                                                                 │
                              └── BrowserRouter → AppContent → Routes                           │
                                                                                                │
    ┌──────────────────────────────────────────────────────────────────────────────────────┐   │
    │  If loading: ProtectedRoute shows spinner                                              │   │
    │  If no user: Redirect to /login                                                       │   │
    │  If user: Render <Outlet /> → DashboardLayout → Page                                  │   │
    └──────────────────────────────────────────────────────────────────────────────────────┘   │
                                                                                                │
    API Response ──────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Page-by-Page Flow with API Calls

## 2.1 LOGIN PAGE (`/login`)

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | User opens app (no token) | - | - | - | Initial load |
| 2 | User enters email/phone + password | LoginPage | - | - | Form fill |
| 3 | User clicks "Sign In" | LoginPage → AuthContext | **POST** | `/api/auth/login` | Submit |
| 4 | Success | AuthContext | - | - | Stores token, sets user |
| 5 | Navigate | LoginPage | - | - | Doctor → `/dashboard`, Patient → `/my-recovery` |

**Request body:** `{ email or phone, password }`  
**Response:** `{ token, user }` → stored in localStorage + AuthContext

---

## 2.2 REGISTER PAGE (`/register`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | User fills form | RegisterPage | - | - | Form fill |
| 2 | User clicks "Create Account" | RegisterPage → AuthContext | **POST** | `/api/auth/register` | Submit |
| 3 | Success | AuthContext | - | - | Stores token, sets user |
| 4 | Navigate | RegisterPage | - | - | → `/dashboard` |

**Request body:** `{ fullName, email, phone, specialization?, hospital?, password }`

---

## 2.3 PATIENT REGISTER PAGE (`/register/patient`)

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | User fills form | PatientRegisterPage | - | - | Form fill |
| 2 | User clicks "Create Account" | PatientRegisterPage → AuthContext | **POST** | `/api/auth/register/patient` | Submit |
| 3 | Success | AuthContext | - | - | Stores token, sets user |
| 4 | Navigate | PatientRegisterPage | - | - | → `/my-recovery` |

**Request body:** `{ name, phone, email?, password }`

---

## 2.4 DASHBOARD PAGE (`/dashboard`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | DashboardPage | **GET** | `/api/dashboard/stats` | useEffect |
| 2 | - | - | - | - | Renders: stat cards, charts, alerts, recent patients |

**Response:** `{ stats, recoveryTrend, statusBreakdown, recentAlerts, recentPatients }`

---

## 2.5 PATIENTS PAGE (`/patients`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | PatientsPage | **GET** | `/api/patients` | useEffect |
| 2 | User searches/filters | PatientsPage | - | - | Client-side filter (no API) |
| 3 | User clicks patient card | PatientsPage | - | - | navigate(`/patients/${id}`) |
| 4 | User clicks Edit icon | PatientsPage | - | - | navigate(`/patients/edit/${id}`) |
| 5 | User clicks Delete | PatientsPage | **DELETE** | `/api/patients/${id}` | handleDelete |
| 6 | After delete | PatientsPage | - | - | Refetch: GET /api/patients (implicit via state update) |

---

## 2.6 ADD PATIENT PAGE (`/patients/add`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | PatientFormPage | - | - | No API (empty form) |
| 2 | User fills form & submits | PatientFormPage | **POST** | `/api/patients` | onSubmit |
| 3 | Success | PatientFormPage | - | - | navigate(`/patients`) |

**Request body:** `{ fullName, age, gender, phone, address, admissionDate, dischargeDate, surgeryType, diagnosis, riskLevel }`

---

## 2.7 EDIT PATIENT PAGE (`/patients/edit/:id`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | PatientFormPage | **GET** | `/api/patients/${id}` | useEffect (if id) |
| 2 | User edits & submits | PatientFormPage | **PUT** | `/api/patients/${id}` | onSubmit |
| 3 | Success | PatientFormPage | - | - | navigate(`/patients`) |

---

## 2.8 PATIENT DETAIL PAGE (`/patients/:id`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | PatientDetailPage | **GET** | `/api/patients/${id}` | useEffect |
| 2 | - | - | - | - | Response includes: patient + medications + recoveryLogs + alerts + nutritionSchedule |
| 3 | User uploads prescription | PatientDetailPage | **POST** | `/api/patients/${id}/prescription` | handlePrescriptionUpload |
| 4 | After upload (if parsed) | PatientDetailPage | **POST** | `/api/medications/bulk` | bulkAddMedications |
| 5 | After upload/bulk | PatientDetailPage | **GET** | `/api/patients/${id}` | fetchPatient (refresh) |
| 6 | User adds medication manually | PatientDetailPage | **POST** | `/api/medications` | handleAddMedication |
| 7 | After add | PatientDetailPage | **GET** | `/api/patients/${id}` | fetchPatient |
| 8 | User deletes medication | PatientDetailPage | **DELETE** | `/api/medications/${medId}` | handleDeleteMed |
| 9 | After delete | PatientDetailPage | **GET** | `/api/patients/${id}` | fetchPatient |
| 10 | User clicks Emergency | PatientDetailPage | **POST** | `/api/patients/${id}/emergency` | handleEmergency |
| 11 | After emergency | PatientDetailPage | **GET** | `/api/patients/${id}` | fetchPatient |

**getPatient response:** Full patient object with nested `medications`, `recoveryLogs`, `alerts`, `nutritionSchedule`

---

## 2.9 PATIENT MAP PAGE (`/patients/map`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | PatientMapPage | **GET** | `/api/patients` | useEffect |
| 2 | - | - | - | - | Filters clientside for patients with location.coordinates |

---

## 2.10 ALERTS PAGE (`/alerts`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | AlertsPage | **GET** | `/api/alerts?resolved=false` or `?resolved=true` or (all) | useEffect |
| 2 | User changes filter | AlertsPage | **GET** | `/api/alerts?resolved=...` | useEffect (filter change) |
| 3 | User clicks Resolve | AlertsPage | **PUT** | `/api/alerts/${id}/resolve` | handleResolve |
| 4 | After resolve | AlertsPage | **GET** | `/api/alerts?resolved=...` | fetchAlerts |

---

## 2.11 ANALYTICS PAGE (`/analytics`) — Doctor

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads | AnalyticsPage | **GET** | `/api/dashboard/stats` | useEffect |
| 2 | Page loads | AnalyticsPage | **GET** | `/api/patients` | useEffect |
| 3 | - | - | - | - | Renders charts from both responses |

---

## 2.12 MESSAGES PAGE (`/messages`) — Doctor & Patient

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads (Doctor) | MessagesPage | **GET** | `/api/patients` | useEffect |
| 2 | Page loads (Patient) | MessagesPage | **GET** | `/api/patients` (if no linkedPatientId) | useEffect |
| 3 | User selects patient | MessagesPage | **GET** | `/api/messages?patientId=${id}` | loadMessages (useEffect) |
| 4 | User sends AI message | MessagesPage | **POST** | `/api/messages/agent` | handleSend |
| 5 | User sends direct message | MessagesPage | **POST** | `/api/messages` | handleSend |

**POST /api/messages/agent body:** `{ patientId, message }` → Gemini AI generates response  
**POST /api/messages body:** `{ patientId, content }` → Direct doctor↔patient message

---

## 2.13 MY RECOVERY PAGE (`/my-recovery`) — Patient

| Step | User Action | Component | API Call | Endpoint | When |
|------|-------------|-----------|----------|----------|------|
| 1 | Page loads (linked) | MyRecoveryPage | **GET** | `/api/patients/${user.linkedPatientId}` | fetchMyData |
| 2 | Page loads (not linked) | MyRecoveryPage | **GET** | `/api/patients?search=${user.phone}&limit=1` | fetchMyData |
| 3 | If found by phone | MyRecoveryPage | **GET** | `/api/patients/${data.data[0]._id}` | fetchMyData |
| 4 | - | - | - | - | Renders: recovery score, pain trend, medications, logs, alerts |

---

# 3. Complete API Endpoint Reference

## Auth (`/api/auth`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| POST | `/login` | LoginPage (AuthContext) | Doctor/Patient login |
| POST | `/register` | RegisterPage (AuthContext) | Doctor registration |
| POST | `/register/patient` | PatientRegisterPage (AuthContext) | Patient registration |
| GET | `/me` | AuthContext (on app load) | Get current user profile |
| PUT | `/me` | - | Update profile |

## Patients (`/api/patients`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| GET | `/` | PatientsPage, PatientMapPage, MessagesPage, MyRecoveryPage, AnalyticsPage | List patients |
| POST | `/` | PatientFormPage (add) | Create patient |
| GET | `/:id` | PatientFormPage (edit), PatientDetailPage, MyRecoveryPage | Get patient detail |
| PUT | `/:id` | PatientFormPage (edit) | Update patient |
| DELETE | `/:id` | PatientsPage, PatientDetailPage | Delete patient |
| POST | `/:id/prescription` | PatientDetailPage | Upload prescription (Gemini parses) |
| POST | `/:id/emergency` | PatientDetailPage | Send emergency alert + WhatsApp |

## Medications (`/api/medications`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| GET | `/:patientId` | - | Get medications (data comes from getPatient) |
| POST | `/` | PatientDetailPage | Add medication manually |
| POST | `/bulk` | PatientDetailPage | Bulk add (after prescription parse) |
| PUT | `/:id` | - | Update medication |
| DELETE | `/:id` | PatientDetailPage | Delete medication |

## Recovery (`/api/recovery`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| GET | `/:patientId` | - | Get recovery logs (data from getPatient) |
| POST | `/:patientId` | - | Add recovery log (WhatsApp/web) |

## Alerts (`/api/alerts`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| GET | `/` | AlertsPage | List alerts (filter: resolved) |
| GET | `/stats` | - | Alert statistics |
| PUT | `/:id/resolve` | AlertsPage | Resolve alert |

## Dashboard (`/api/dashboard`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| GET | `/stats` | DashboardPage, AnalyticsPage | Dashboard stats, charts data |

## Messages (`/api/messages`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| GET | `?patientId=` | MessagesPage | Get chat history |
| POST | `/` | MessagesPage | Send direct message |
| POST | `/agent` | MessagesPage | AI chat (Gemini) |

## Webhook (`/api/webhook`)

| Method | Endpoint | Used By | Description |
|--------|----------|---------|--------------|
| POST | `/whatsapp` | Twilio (external) | Incoming WhatsApp messages |

---

# 4. User Journey Flow Diagram

```
                    ┌─────────────────┐
                    │   User visits   │
                    │   localhost     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Has token?     │
                    └────────┬────────┘
                       ┌─────┴─────┐
                       │           │
                      No          Yes
                       │           │
              ┌────────▼──────┐   │
              │  /login        │   │
              │  /register     │   │
              └────────┬──────┘   │
                       │           │
              POST /auth/login     │
              POST /auth/register  │
                       │           │
                       └─────┬─────┘
                             │
                    ┌────────▼────────┐
                    │  GET /auth/me   │
                    │  (verify token) │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
       Doctor role                   Patient role
              │                             │
    ┌────────▼────────┐           ┌────────▼────────┐
    │  /dashboard     │           │  /my-recovery   │
    │  GET /dashboard │           │  GET /patients  │
    │  /stats         │           │  /:linkedId     │
    └────────┬────────┘           └─────────────────┘
             │
    ┌────────┼────────────────────────────────────────┐
    │        │                                         │
    ▼        ▼                                         ▼
 /patients  /alerts  /analytics  /messages  /patients/map
 GET        GET      GET         GET        GET
 /patients  /alerts  /dashboard  /patients  /patients
            /stats   /stats
                     /patients
```

---

# 5. Data Flow: Patient Detail Page (Most Complex)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  PATIENT DETAIL PAGE — FULL API FLOW                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘

  MOUNT
    │
    └──► GET /api/patients/:id
              │
              ├── Server: Patient.findOne + populate doctor
              ├── Server: Prescription.find (medications)
              ├── Server: DailyLog.find (recovery logs)
              ├── Server: Alert.find
              ├── Server: NutritionSchedule.findOne
              │
              └── Response: { patient, medications, recoveryLogs, alerts, nutritionSchedule }

  TAB: Medications
    │
    ├── Upload Prescription
    │     └──► POST /api/patients/:id/prescription (multipart)
    │           │
    │           ├── Server: Multer saves file
    │           ├── Server: Gemini parsePrescription (image → JSON)
    │           └── Response: { parsedMedications[] }
    │
    │     └──► POST /api/medications/bulk { patientId, medications }
    │           └── Server: Prescription.insertMany
    │
    ├── Add Manually
    │     └──► POST /api/medications { patient, medicineName, dosage, ... }
    │
    └── Delete
          └──► DELETE /api/medications/:id

  Emergency Button
    └──► POST /api/patients/:id/emergency { message }
          │
          ├── Server: Alert.create (severity: high)
          ├── Server: Patient.update (status: Critical)
          └── Server: Twilio sendWhatsApp (to patient)

  After any mutation
    └──► GET /api/patients/:id (fetchPatient — refresh full data)
```

---

# 6. External Integrations

| Service | When Used | API/Trigger |
|---------|-----------|--------------|
| **MongoDB** | All data operations | Via Mongoose |
| **Twilio WhatsApp** | Medication reminders (cron), Emergency alert, Direct messages | schedulerService, patientController, messageController |
| **Gemini AI** | Prescription parsing, AI chat | geminiService, messageController |
| **OpenStreetMap Nominatim** | Geocode address on patient create/update | patientController geocodeAddress |
| **Leaflet/OSM Tiles** | Patient map display | Client-side only |

---

# 7. Cron Jobs (Background)

| Time | Job | API/Service |
|------|-----|-------------|
| 8:00 AM | Morning medication reminders | Prescription.find → Twilio sendWhatsApp |
| 1:00 PM | Afternoon medication reminders | Same |
| 8:00 PM | Evening medication reminders | Same |
| 10:00 AM | Daily follow-up check-ins | Patient.find (active) → Twilio sendFollowUpQuestion |

---

*PostCare AI — Detailed Architecture | Every Step, Every Page, Every API*
