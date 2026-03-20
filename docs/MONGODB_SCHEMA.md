# PostCare AI - Full MongoDB Schema

## Database: `postcareai` (or your configured DB name)

---

## 1. Doctor (Collection: `doctors`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| fullName | String | ✅ | - | 2-100 chars |
| email | String | ✅ | - | Unique, lowercase |
| password | String | ✅ | - | Min 6 chars, hashed, select: false |
| specialization | String | - | 'General' | e.g. Cardiology |
| phone | String | ✅ | - | Contact number |
| hospital | String | - | - | Hospital name |
| role | String | - | 'doctor' | enum: `doctor`, `admin` |
| avatar | String | - | '' | Profile image path |
| createdAt | Date | auto | - | from timestamps |
| updatedAt | Date | auto | - | from timestamps |

---

## 2. Patient (Collection: `patients`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| doctor | ObjectId | ✅ | - | ref: Doctor |
| fullName | String | ✅ | - | 2-100 chars |
| age | Number | ✅ | - | 0-150 |
| gender | String | ✅ | - | enum: `Male`, `Female`, `Other` |
| phone | String | ✅ | - | WhatsApp-enabled |
| address | String | - | '' | |
| admissionDate | Date | - | Date.now | |
| dischargeDate | Date | - | - | |
| surgeryType | String | - | '' | |
| operationDate | Date | - | - | |
| diagnosis | String | - | '' | |
| treatmentSummary | String | - | '' | |
| prescriptionFile | String | - | '' | Upload path |
| status | String | - | 'Active' | enum: `Active`, `Discharged`, `Critical`, `Recovered` |
| riskLevel | String | - | 'Low' | enum: `Low`, `Medium`, `High` |
| recoveryScore | Number | - | 0 | 0-100 |
| createdAt | Date | auto | - | |
| updatedAt | Date | auto | - | |

**Indexes:** `{ doctor: 1, status: 1 }`, `{ doctor: 1, riskLevel: 1 }`

---

## 3. Medication (Collection: `medications`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| patient | ObjectId | ✅ | - | ref: Patient |
| doctor | ObjectId | ✅ | - | ref: Doctor |
| medicineName | String | ✅ | - | |
| dosage | String | ✅ | - | e.g. 500mg |
| frequency | Object | - | - | morning, afternoon, evening (Boolean) |
| foodInstruction | String | - | 'After Food' | enum: `Before Food`, `After Food`, `With Food`, `Any Time` |
| startDate | Date | ✅ | Date.now | |
| endDate | Date | ✅ | - | |
| duration | String | - | '' | e.g. "30 days" |
| isActive | Boolean | - | true | |
| remindersSent | Array | - | [] | { sentAt, timeSlot, status } |
| createdAt | Date | auto | - | |
| updatedAt | Date | auto | - | |

**frequency sub-document:**
- `morning`: Boolean
- `afternoon`: Boolean
- `evening`: Boolean

**remindersSent item:**
- `sentAt`: Date
- `timeSlot`: enum `morning`, `afternoon`, `evening`
- `status`: enum `sent`, `delivered`, `failed`

**Index:** `patient` (1)

---

## 4. Alert (Collection: `alerts`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| patient | ObjectId | ✅ | - | ref: Patient |
| doctor | ObjectId | ✅ | - | ref: Doctor |
| severity | String | ✅ | 'Low' | enum: `Low`, `Medium`, `High` |
| message | String | ✅ | - | |
| type | String | - | 'symptom' | enum: `symptom`, `medication`, `emergency`, `system` |
| resolved | Boolean | - | false | |
| resolvedAt | Date | - | - | |
| resolvedBy | ObjectId | - | - | ref: Doctor |
| createdAt | Date | auto | - | |
| updatedAt | Date | auto | - | |

**Indexes:** `patient` (1), `doctor` (1), `{ doctor: 1, resolved: 1, severity: 1 }`

---

## 5. NutritionSchedule (Collection: `nutritionschedules`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| patient | ObjectId | ✅ | - | ref: Patient |
| doctor | ObjectId | ✅ | - | ref: Doctor |
| breakfast | Array | - | [] | mealItemSchema |
| morningSnack | Array | - | [] | mealItemSchema |
| lunch | Array | - | [] | mealItemSchema |
| eveningSnack | Array | - | [] | mealItemSchema |
| dinner | Array | - | [] | mealItemSchema |
| restrictions | [String] | - | [] | e.g. "Low sugar" |
| specialInstructions | String | - | '' | |
| startDate | Date | - | Date.now | |
| endDate | Date | - | - | |
| isActive | Boolean | - | true | |
| createdAt | Date | auto | - | |
| updatedAt | Date | auto | - | |

**mealItemSchema (for breakfast, lunch, etc.):**
- `name`: String (required)
- `quantity`: String
- `calories`: Number
- `notes`: String

---

## 6. RecoveryLog (Collection: `recoverylogs`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| patient | ObjectId | ✅ | - | ref: Patient |
| date | Date | - | Date.now | |
| painLevel | Number | - | 0 | 0-10 scale |
| symptoms | [String] | - | [] | |
| medicineAdherence | Boolean | - | true | Taken meds? |
| message | String | - | '' | Patient message |
| source | String | - | 'manual' | enum: `whatsapp`, `manual`, `system` |
| mood | String | - | 'Good' | enum: `Good`, `Fair`, `Poor`, `Critical` |
| notes | String | - | '' | |
| vitalSigns | Object | - | - | Sub-document |
| createdAt | Date | auto | - | |
| updatedAt | Date | auto | - | |

**vitalSigns sub-document:**
- `temperature`: Number (°C)
- `bloodPressure`: String (e.g. "120/80")
- `heartRate`: Number (bpm)
- `oxygenLevel`: Number (SpO2 %)

**Index:** `{ patient: 1, date: -1 }`

---

## Entity Relationship Diagram

```
Doctor (1) ──────< Patient (many)
    │                   │
    │                   ├──< Medication (many)
    │                   ├──< Alert (many)
    │                   ├──< NutritionSchedule (many)
    │                   └──< RecoveryLog (many)
    │
    └── Referenced in: Medication.doctor, Alert.doctor, NutritionSchedule.doctor
```

---

## Collection Names (Mongoose defaults)

| Model | MongoDB Collection |
|-------|-------------------|
| Doctor | doctors |
| Patient | patients |
| Medication | medications |
| Alert | alerts |
| NutritionSchedule | nutritionschedules |
| RecoveryLog | recoverylogs |
