Healthcare Hackathon – Production-Ready Architecture

1️⃣ SYSTEM OVERVIEW

This system is a Doctor Web App + Patient React Native App + WhatsApp AI Agent that:

Stores full patient admission & prescription data

Automatically schedules medicine & nutrition reminders

Performs AI-based WhatsApp follow-ups

Detects symptom risk using LLM

Alerts doctors in real-time

Provides a recovery tracking dashboard

2️⃣ SYSTEM ARCHITECTURE
Doctor Web (PC)
      ↓
Backend API (Node / Python)
      ↓
MongoDB Database
      ↓
Scheduler (Cron / Queue)
      ↓
OpenClaw Agent + Twilio WhatsApp
      ↓
Patient WhatsApp
      ↓
Patient React Native App
      ↓
Emergency / Chat / Recovery Logs
      ↓
Doctor Dashboard Alerts
3️⃣ COMPLETE MODULE BREAKDOWN
🔹 MODULE 1 – DOCTOR WEB APPLICATION (PC SIDE)
Purpose:

Doctors manage patient data, prescriptions, surgeries, medication schedules, and communication.

Doctor Dashboard UI Features
1. Add Patient Form

Fields:

Basic Details

Patient Name

Age

Gender

Phone Number (WhatsApp enabled)

Address

Admission Date

Discharge Date

Medical History

Surgery Type

Operation Date

Diagnosis

Treatment Summary

Medication Section

Medicine Name

Dosage

Morning / Afternoon / Evening toggle

Before Food / After Food

Duration (days)

Start Date

End Date

Nutrition Plan

Meal Type

Time

Restrictions

Required Nutrients

Prescription Upload

Upload PDF / Image

Manual entry option

🔹 Gemini Prescription Auto-Parser

When doctor uploads prescription:

File sent to backend

Backend sends to Gemini API

Gemini extracts:

Medicine Names

Dosage

Schedule

Duration

Surgery Info

Auto-fill form fields

Doctor reviews and confirms

Example Gemini Prompt:
Extract:
- Medicine name
- Dosage
- Frequency
- Duration
- Food instructions
Return in JSON format.
🔹 MODULE 2 – DATABASE DESIGN (MongoDB)
Collections
Patients
{
  _id,
  name,
  age,
  gender,
  phone,
  admissionDate,
  dischargeDate,
  surgery,
  treatmentSummary,
  riskLevel,
  status
}
Medications
{
  patientId,
  medicineName,
  dosage,
  scheduleTime,
  foodInstruction,
  startDate,
  endDate
}
Nutrition
{
  patientId,
  mealType,
  time,
  notes
}
RecoveryLogs
{
  patientId,
  date,
  symptoms,
  painLevel,
  temperature,
  notes
}
Alerts
{
  patientId,
  alertType,
  severity,
  message,
  createdAt,
  resolved
}
🔹 MODULE 3 – WHATSAPP FOLLOW-UP AGENT
Powered by:

Twilio WhatsApp API

OpenClaw Agent

LLM (Gemini / OpenAI)

Automated Flows
1️⃣ Medicine Reminder

Triggered by scheduler:

Message:

Hi John,
It’s time to take:
Paracetamol 500mg
After food.
Reply DONE once taken.
2️⃣ Daily Recovery Check-In

Sent once daily:

Good morning!
How are you feeling today?
1. No pain
2. Mild pain
3. Severe pain
4. Fever
5. Swelling

Responses saved to database.

3️⃣ Risk Detection

If patient replies:

Severe pain

High fever

Bleeding

Vomiting

LLM classifies severity.

If high-risk → Trigger Doctor Alert

🔹 MODULE 4 – DOCTOR ALERT SYSTEM

When risk detected:

Dashboard Alert Card:

Patient Name

Symptom

Severity

Time

Quick Action Buttons:

Call Patient

Send Message

Mark Resolved

Doctor also receives:

WhatsApp Notification

SMS (optional)

🔹 MODULE 5 – PATIENT REACT NATIVE APP
Features
1. Dashboard

Today’s medicines

Next reminder countdown

Nutrition plan

Recovery progress chart

2. Emergency Button

Large red 3D animated button:

When pressed:

Sends emergency alert

Notifies doctor dashboard

Sends WhatsApp to doctor

3. AI Chat Assistant

Patient can type:

“I have headache”

“Can I take extra tablet?”

“What food should I eat?”

LLM:

Reads prescription summary

Reads medication schedule

Gives safe responses

Escalates if risky

4. Prescription View

Auto summarized version

Full document preview

Medicine timeline view

🔹 MODULE 6 – SCHEDULER SYSTEM

Use:

Node Cron

BullMQ

Or Python APScheduler

Workflow:

Query medications table

Check time

Send WhatsApp message

Log sent status

🔹 MODULE 7 – API DOCUMENTATION
Base URL
http://localhost:3000/api
PATIENT APIs
Create Patient

POST /patients

Body:

{
  "name": "",
  "phone": "",
  "admissionDate": "",
  "dischargeDate": "",
  "surgery": "",
  "treatmentSummary": ""
}
Upload Prescription

POST /patients/:id/prescription

FormData:

file

Response:

{
  "parsedData": {
    "medicines": [],
    "schedule": []
  }
}
Add Medication

POST /medications

Get Patient Details

GET /patients/:id

Emergency Trigger

POST /patients/:id/emergency

Save Recovery Log

POST /patients/:id/recovery

WHATSAPP WEBHOOK

POST /webhook/whatsapp

Handles:

Incoming patient replies

Classify message

Save response

Trigger alerts

🔹 MODULE 8 – RECOVERY DASHBOARD

Doctor sees:

Recovery Score %

Pain trend chart

Medicine adherence %

Missed doses

Risk classification

🔹 MODULE 9 – UI DESIGN GUIDELINES (FUTURISTIC)

For Web + React Native:

Design System

Font: Poppins

Dark + Light Mode

Glassmorphism cards

Neon accents

Soft gradients

Floating 3D buttons

Animated background particles

Smooth transitions

Doctor Dashboard Sections

Patient Overview Grid

Active Alerts Panel

Risk Heat Map

Recovery Analytics

Quick Chat Panel

Patient App Design

Minimal

Big CTA buttons

Medicine timeline UI

Animated reminder clock

3D Emergency Button

🔹 SECURITY ARCHITECTURE

JWT authentication

Role-based access

Encrypted prescription storage

HIPAA-style data separation

Twilio webhook validation

🔹 DELIVERABLES CHECKLIST

✔ Doctor Web App
✔ Patient React Native App
✔ WhatsApp AI Agent
✔ Scheduler
✔ Prescription Parser (Gemini)
✔ Risk Detection
✔ Alert System
✔ Recovery Dashboard
✔ API Documentation

🔹 HACKATHON ALIGNMENT

Matches Problem #23 – Healthcare
Autonomous Patient Follow-up Agent

✔ Post-surgery monitoring
✔ Symptom tracking
✔ Automated messaging
✔ Early complication detection
✔ Alert system
✔ Dashboard

🔹 FUTURE EXTENSIONS

Wearable integration

Heart rate monitoring

AI risk scoring

Hospital ERP integration

Multi-doctor support

Voice-based WhatsApp bot