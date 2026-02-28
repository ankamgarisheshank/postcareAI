# PostCare AI — Web Application & Full Platform Documentation

> Autonomous Patient Follow-up Agent — Doctor Web Dashboard + Express API + React Native Mobile App + VAPI Voice AI

---

## Overview

PostCare AI is a comprehensive post-surgical patient monitoring platform built for **Healthcare Hackathon (Problem #23)**. This repository contains the **web application** (Express server + React dashboard) and integrates with a React Native mobile app and Next.js backend for AI-powered autonomous follow-ups.

### What It Does

1. **Doctors** manage patients, prescriptions, and alerts through a web dashboard
2. **Patients** interact via a mobile app with AI chat, medication views, and voice call scheduling
3. **AI Agent** (OpenClaw) autonomously evaluates symptoms, sends reminders, and escalates emergencies
4. **VAPI Voice AI** calls patients in Telugu/Hindi/English to deliver personalized recovery updates
5. **WhatsApp** (Twilio) sends automated medication reminders on a cron schedule

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                        DOCTOR WORKFLOW                            │
│  Web Dashboard (React + Vite, port 5173)                         │
│  ├── Login → JWT Auth                                            │
│  ├── Dashboard → Patients overview, risk stats, recovery trends  │
│  ├── Add Patient → Form + Prescription upload (Gemini AI parse)  │
│  ├── Patient Detail → Meds, vitals, alerts, AI chat, VAPI calls │
│  ├── Alerts → Critical/Monitor/System with quick actions         │
│  ├── Analytics → Recharts graphs: adherence, pain, risk          │
│  ├── Messages → Doctor ↔ Patient chat via OpenClaw agent         │
│  └── Patient Map → Leaflet/OpenStreetMap geographic view         │
└────────────────────────┬──────────────────────────────────────────┘
                         │ Axios + JWT
                         ▼
┌───────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS API (port 5000)                     │
│  ├── Auth (login/register/me/verify/patients)                    │
│  ├── Patients CRUD (7 endpoints)                                 │
│  ├── Medications (prescriptions, reminders)                      │
│  ├── Recovery (daily logs, scores)                               │
│  ├── Alerts (list, resolve, create)                              │
│  ├── Dashboard (aggregated stats)                                │
│  ├── Messages (chat + OpenClaw AI agent)                         │
│  ├── Nutrition (meal plans)                                      │
│  ├── Schedule (VAPI call management)                             │
│  └── Webhook (Twilio inbound)                                    │
│                                                                   │
│  Services:                                                        │
│  ├── Gemini AI → Prescription parsing, health insights           │
│  ├── Twilio → WhatsApp messaging + reminders                    │
│  ├── VAPI → Voice call triggering                                │
│  ├── OpenRouter → English→Telugu/Hindi translation               │
│  └── Scheduler → Cron: 8AM, 1PM, 8PM meds + 10AM follow-up     │
└────────────────────────┬──────────────────────────────────────────┘
                         │ Mongoose ODM
                         ▼
               ┌──────────────────┐
               │  MongoDB Atlas   │
               │  11 Collections  │
               └──────────────────┘
```

---

## Web App — Directory Structure

```
postcareAI/
├── server/
│   ├── server.js                    # Express app entry point
│   ├── config/
│   │   ├── constants.js             # App constants
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── alertController.js       # Alert CRUD + resolve
│   │   ├── authController.js        # Login, register, JWT
│   │   ├── dashboardController.js   # Aggregated stats
│   │   ├── medicationController.js  # Prescription management
│   │   ├── messageController.js     # Chat + OpenClaw agent proxy
│   │   ├── nutritionController.js   # Meal plan management
│   │   ├── patientController.js     # Patient CRUD + file upload
│   │   ├── recoveryController.js    # Daily logs + recovery score
│   │   ├── scheduleController.js    # VAPI call scheduling
│   │   └── webhookController.js     # Twilio inbound webhooks
│   ├── models/
│   │   ├── Doctor.js / User.js      # Doctor/user accounts
│   │   ├── Patient.js               # Patient records
│   │   ├── Medication.js / Prescription.js
│   │   ├── Alert.js                 # Risk alerts
│   │   ├── CallSchedule.js          # VAPI call schedules
│   │   ├── DailyLog.js / RecoveryLog.js
│   │   ├── Message.js               # Chat messages
│   │   └── NutritionSchedule.js     # Meal plans
│   ├── routes/                      # Express route definitions
│   ├── services/
│   │   ├── geminiService.js         # Google Gemini 1.5 Flash
│   │   ├── twilioService.js         # WhatsApp + SMS
│   │   ├── vapiService.js           # VAPI outbound calls
│   │   ├── translationService.js    # OpenRouter translation
│   │   └── schedulerService.js      # node-cron jobs
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   ├── errorHandler.js          # Global error handler
│   │   └── upload.js                # Multer file uploads
│   ├── scripts/
│   │   └── seed.js                  # Database seeding
│   └── .env                         # Environment configuration
│
├── client/
│   ├── src/
│   │   ├── App.jsx                  # Root component + routing
│   │   ├── main.jsx                 # Entry point
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Doctor login
│   │   │   ├── RegisterPage.jsx     # Doctor registration
│   │   │   ├── PatientRegisterPage.jsx
│   │   │   ├── DashboardPage.jsx    # Overview: stats, charts, alerts
│   │   │   ├── PatientsPage.jsx     # Patient list + search
│   │   │   ├── PatientFormPage.jsx  # Add/edit patient + Rx upload
│   │   │   ├── PatientDetailPage.jsx # Full patient view (11 sections)
│   │   │   ├── PatientMapPage.jsx   # Geographic patient map
│   │   │   ├── AlertsPage.jsx       # Alert management
│   │   │   ├── AnalyticsPage.jsx    # Recovery analytics
│   │   │   ├── MessagesPage.jsx     # AI chat + doctor messages
│   │   │   └── MyRecoveryPage.jsx   # Patient self-service recovery
│   │   ├── context/                 # Auth + Theme providers
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layouts/                 # Page layouts
│   │   ├── routes/                  # Route definitions
│   │   └── services/                # Axios API client
│   └── index.html
│
└── docs/
    ├── ARCHITECTURE_DIAGRAM.md      # Full system architecture
    ├── DETAILED_ARCHITECTURE.md     # Page-by-page API flow
    ├── MONGODB_SCHEMA.md            # Database schema documentation
    └── VAPI_ASSISTANT_PROMPT.md     # Voice AI assistant prompt
```

---

## Setup & Installation

### Prerequisites
- **Node.js** 18+
- **MongoDB Atlas** account (or local MongoDB)
- **Twilio** account with WhatsApp sandbox
- **VAPI** account for voice AI
- **OpenClaw** gateway running locally (port 18789)

### 1. Clone & Install

```bash
git clone https://github.com/ankamgarisheshank/postcareAI.git
cd postcareAI

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/patient-followup
JWT_SECRET=your_secret_key

# AI
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
GEMINI_API_KEY=your_gemini_key

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_WHATSAPP_FROM=whatsapp:+1...

# VAPI Voice AI
VAPI_PRIVATE_KEY=...
VAPI_PUBLIC_KEY=...
VAPI_ASSISTANT_ID=...
VAPI_PHONE_NUMBER_ID=...

CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

```bash
# Terminal 1: Express API
cd server
npm run dev          # → http://localhost:5000

# Terminal 2: React Dashboard
cd client
npm run dev          # → http://localhost:5173
```

### 4. Seed Database (Optional)
```bash
cd server
npm run seed
```

---

## API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | `{phone, password}` | Login (returns JWT) |
| POST | `/api/auth/register` | `{fullName, email, password, phone, specialization}` | Doctor signup |
| GET | `/api/auth/me` | — | Get current user |
| POST | `/api/auth/verify` | `{token}` | Verify JWT |
| POST | `/api/auth/patient/register` | `{phone, password, name}` | Patient signup |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all doctor's patients |
| POST | `/api/patients` | Create patient (+ file upload) |
| GET | `/api/patients/:id` | Get patient details |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Remove patient |
| POST | `/api/patients/:id/prescriptions/bulk` | Bulk add prescriptions |
| POST | `/api/patients/:id/emergency` | Create emergency alert |

### Medications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medications` | Add medication |
| GET | `/api/medications/patient/:id` | Patient's medications |
| PUT | `/api/medications/:id` | Update medication |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get all alerts (filterable) |
| PUT | `/api/alerts/:id/resolve` | Resolve an alert |
| POST | `/api/alerts` | Create alert |

### Messages & AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:patientId` | Get chat history |
| POST | `/api/messages` | Send message |
| POST | `/api/messages/agent` | AI chat via OpenClaw |

### Schedule (VAPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/schedule/vapi` | Schedule/trigger voice call |
| GET | `/api/schedule/vapi` | List scheduled calls |

### Other
| GET | `/api/dashboard` | Aggregated dashboard stats |
| POST | `/api/recovery/:patientId` | Add daily recovery log |
| GET | `/api/recovery/:patientId` | Get recovery history |
| POST | `/api/nutrition` | Set nutrition schedule |
| POST | `/api/webhook/twilio` | Twilio inbound webhook |

---

## React Native Mobile App Implementation

The mobile app lives in the `mobile/` directory (separate from this repo) and connects to a **Next.js backend** on port 3000.

### Mobile Tech Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Expo | 54.0 | React Native framework |
| React Native | 0.81.5 | Mobile UI |
| Expo Router | 6.0 | File-based navigation |
| Expo Speech | 14.0 | Text-to-Speech for AI responses |
| React Navigation | 7.x | Tab & stack navigation |
| AsyncStorage | 2.2 | Local auth persistence |
| TypeScript | 5.9 | Type safety |

### Mobile App Structure

```
mobile/
├── app/
│   ├── _layout.tsx              # Root layout with font loading
│   ├── index.tsx                # Auth gate → login or role routing
│   │
│   ├── patient/                 # Patient role screens
│   │   ├── _layout.tsx          # Bottom tab navigator (4 tabs)
│   │   ├── index.tsx            # Dashboard: vitals, reminders, recovery
│   │   ├── ai-chat.tsx          # AI Chat with OpenClaw agent
│   │   ├── medications.tsx      # Prescription list with details
│   │   └── call-scheduler.tsx   # VAPI voice call scheduling
│   │
│   └── doctor/                  # Doctor role screens
│       ├── _layout.tsx          # Bottom tab navigator (4 tabs)
│       ├── index.tsx            # Patient list with risk indicators
│       ├── patient-detail.tsx   # Full patient view
│       ├── alerts.tsx           # Alert management
│       └── add-patient.tsx      # Add new patient form
│
├── src/
│   ├── components/
│   │   ├── AnimatedParticles.tsx  # Floating particle background
│   │   ├── GlassCard.tsx          # Glassmorphism card component
│   │   └── Icons.tsx              # 35+ custom SVG icons
│   ├── config/
│   │   ├── api.ts                 # API base URL + apiFetch() utility
│   │   └── theme.ts               # Colors, spacing, fonts, borders
│   └── context/
│       └── AuthContext.tsx         # Auth state + AsyncStorage
│
├── app.json                     # Expo configuration
├── package.json
└── tsconfig.json
```

### Mobile Design System

The mobile app uses a **Void Black** theme with glassmorphism:

| Token | Value | Usage |
|-------|-------|-------|
| `Colors.background` | `#000000` | Screen backgrounds |
| `Colors.card` | `#111111` | Card surfaces |
| `Colors.white` | `#FFFFFF` | Primary text |
| `Colors.stable` | `#6EE7A0` | ✓ Good status, success |
| `Colors.monitor` | `#FBBF24` | ⚠ Warning, pending |
| `Colors.critical` | `#F87171` | ✗ Error, critical alert |
| `Colors.textSecondary` | `#737373` | Muted text |
| `Colors.glassBorder` | `rgba(255,255,255,0.08)` | Glass card borders |
| Font Family | Poppins | 400, 500, 600, 700 weights |

### Mobile Screens — Detailed

#### Patient: AI Chat (`ai-chat.tsx`)
- Full-featured chat interface with OpenClaw AI agent
- **TTS Toggle** — Header button to enable/disable text-to-speech
- **Stop Speaking** — Button appears when TTS is active
- **Quick Actions** — Pre-built buttons: "Schedule Call", "Next Dose?", "Recovery"
- **Intent Badges** — Visual indicators for AI actions (green phone icon for VAPI)
- **Auto-stop TTS** — Speech stops when navigating away from the tab
- Sends messages to `/api/agent` (OpenClaw) and displays responses

#### Patient: Call Scheduler (`call-scheduler.tsx`)
- **Natural Language Scheduling** — Type "Call me tomorrow morning about my medications" → AI agent parses and creates VAPI schedule
- **Quick Presets** — "Morning Reminder", "Evening Check-up", "Call Now" buttons
- **Schedule List** — Upcoming & past calls with status badges:
  - 🟡 Scheduled (pending)
  - 🟢 Completed
  - 🔴 Failed
  - ⚫ Cancelled
- **Translation Preview** — Shows Telugu & Hindi translations on each call card
- **Pull-to-Refresh** — Swipe down to reload schedules

#### Patient: Medications (`medications.tsx`)
- Full prescription viewer from doctor-uploaded data
- Displays: drug name, dosage, frequency, timing (morning/afternoon/evening icons)
- Instructions and date ranges
- Clean card-based layout with active/inactive filtering

#### Patient: Dashboard (`index.tsx`)
- Recovery status overview
- Upcoming medication reminders
- Recent alerts and notifications
- Quick navigation to other screens

#### Doctor: Patient List (`doctor/index.tsx`)
- All assigned patients with risk status indicators
- Color-coded: Stable (green), Monitor (yellow), Critical (red)
- Search and filter functionality
- Tap to view patient detail

#### Doctor: Alerts (`doctor/alerts.tsx`)
- Real-time alert feed
- Severity-based filtering
- Quick actions: Call, Message, Resolve

### Mobile Authentication Flow

```
App Launch
    │
    ▼
AsyncStorage.getItem("postcareai_user")
    │
    ├── Found → Parse user → Check role
    │                           ├── "doctor" → /doctor/ tabs
    │                           └── "patient" → /patient/ tabs
    │
    └── Not found → Login screen
                        │
                        ▼
                POST /api/auth/login
                { phone, password }
                        │
                        ▼
                Returns: { id, name, role, phone, linkedPatientId }
                        │
                        ▼
                AsyncStorage.setItem → Route to role tabs
```

### Mobile ↔ Next.js Backend Communication

The mobile app communicates with the Next.js server (port 3000) via `apiFetch()`:

```typescript
// mobile/src/config/api.ts
export const API_BASE = "http://10.250.2.59:3000";

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}/api${endpoint}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}
```

### Next.js Backend (port 3000) — Mobile API

The Next.js backend serves the mobile app with these key services:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Mobile login (returns user object) |
| `/api/agent` | POST | OpenClaw AI agent chat |
| `/api/patients` | GET | Patient data |
| `/api/prescriptions` | GET | Prescriptions for patient |
| `/api/alerts` | GET | Alerts list |
| `/api/schedule/vapi` | POST | Doctor: schedule VAPI calls (JWT) |
| `/api/schedule/patient` | GET | Patient: view call schedules |
| `/api/logs` | POST | Submit daily recovery log |

**Key Backend Services:**

1. **OpenClaw Skills** (`backend/src/lib/openclaw/skills.ts` — 680 lines)
   - `evaluateSymptoms` — Checks for 10+ red-flag symptoms, auto-creates alerts
   - `checkDrugReminders` — Queries prescriptions, identifies missed doses
   - `readPrescription` — Explains medication details in plain language
   - `scheduleVapiCall` — Parses natural language → creates VAPI call schedule
   - `sendWhatsappMessage` — Sends messages via Twilio
   - `getRecoveryStatus` — Summarizes recovery trends

2. **Translation Service** (`backend/src/lib/translationService.ts`)
   - Uses OpenRouter (GPT-4o-mini) to translate English → Telugu (native script) + Hindi (Devanagari)
   - All VAPI calls include trilingual `variableValues: {english, telugu, hindi}`

3. **VAPI Service** (`backend/src/lib/vapiService.ts`)
   - Creates outbound phone calls via VAPI API
   - Sends `assistantOverrides.variableValues` for multi-language support
   - VAPI assistant greets patient → asks language preference → speaks in chosen language

---

## VAPI Voice Call Workflow

```
┌──────────────────────┐
│ Patient says in chat: │
│ "Call me tomorrow     │
│  about my meds"       │
└──────────┬───────────┘
           │ POST /api/agent
           ▼
┌──────────────────────┐
│ OpenClaw AI Agent    │
│ Parses intent →      │
│ scheduleVapiCall()   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ translateMessage()   │
│ English → Telugu     │
│ English → Hindi      │
│ (via OpenRouter)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Store in MongoDB     │
│ CallSchedule {       │
│   scheduledAt,       │
│   message,           │
│   englishMessage,    │
│   teluguMessage,     │
│   hindiMessage,      │
│   status: "pending"  │
│ }                    │
└──────────┬───────────┘
           │ When scheduledAt arrives
           ▼
┌──────────────────────┐
│ VAPI API Call        │
│ POST api.vapi.ai/call│
│ {                    │
│   assistantId,       │
│   phoneNumberId,     │
│   customer: {        │
│     number, name     │
│   },                 │
│   variableValues: {  │
│     english, telugu, │
│     hindi            │
│   }                  │
│ }                    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Patient receives     │
│ phone call from AI   │
│ → "Namaste! Telugu,  │
│    Hindi or English?"│
│ → Speaks recovery    │
│   info in chosen     │
│   language           │
└──────────────────────┘
```

---

## Cron-Based Automation

| Schedule | Job | Action |
|----------|-----|--------|
| **8:00 AM** | Morning medication reminder | WhatsApp message to patients with morning meds |
| **1:00 PM** | Afternoon medication reminder | WhatsApp message for afternoon doses |
| **8:00 PM** | Evening medication reminder | WhatsApp message for evening doses |
| **10:00 AM** | Daily follow-up | Recovery check-in, symptom monitoring |

---

## Database Collections

| Collection | Key Fields | Relationships |
|-----------|-----------|---------------|
| **Doctor/User** | fullName, email, phone, specialization, password | — |
| **Patient** | fullName, age, phone, surgeryType, status, riskLevel, recoveryScore | → Doctor |
| **Medication/Prescription** | drugName, dosage, frequency, scheduleTimes | → Patient, Doctor |
| **Alert** | severity, message, type, resolved | → Patient, Doctor |
| **CallSchedule** | scheduledAt, message, englishMessage, teluguMessage, hindiMessage, status | → Patient, Doctor |
| **DailyLog/RecoveryLog** | painLevel, symptoms, medicineAdherence, mood, vitalSigns | → Patient |
| **NutritionSchedule** | breakfast, lunch, dinner, restrictions | → Patient, Doctor |
| **Message** | content, sender, receiver | → Patient, Doctor |

Full schema: [docs/MONGODB_SCHEMA.md](docs/MONGODB_SCHEMA.md)

---

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| **MongoDB Atlas** | Cloud database | `MONGO_URI` env var |
| **Twilio** | WhatsApp + SMS | SID, Auth Token, Phone Number |
| **VAPI** | Voice AI phone calls | Private Key, Assistant ID, Phone Number ID |
| **OpenRouter** | LLM translation (GPT-4o-mini) | API Key |
| **Google Gemini** | Prescription parsing | API Key |
| **OpenClaw** | AI agent gateway (local) | `http://127.0.0.1:18789` |
| **OpenStreetMap** | Patient geocoding/mapping | Free (no key needed) |

---

## Security

- **JWT Authentication** — All protected routes require Bearer token
- **Password Hashing** — bcrypt with salt rounds
- **Role-Based Access** — Doctor vs Patient permissions
- **Helmet** — HTTP security headers
- **CORS** — Configured for client origin
- **File Upload** — Multer with size/type restrictions
- **Webhook Validation** — Twilio signature verification

---

## Scripts

```bash
# Server
npm run dev          # Start with --watch (auto-restart)
npm start            # Production start
npm run seed         # Seed database with sample data

# Client
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## License

ISC
