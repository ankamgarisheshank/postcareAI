/**
 * PostCare AI - Database Seed Script
 * Populates MongoDB with sample doctors, patients, medications, alerts, nutrition & recovery logs
 * 
 * Usage: npm run seed (from server directory)
 * Or: node scripts/seed.js (with MONGO_URI in .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Medication = require('../models/Medication');
const Alert = require('../models/Alert');
const NutritionSchedule = require('../models/NutritionSchedule');
const RecoveryLog = require('../models/RecoveryLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dheeraxgamerz_db_user:WgS7xhmhDdywGRK0@cluster0.efhgprs.mongodb.net/postcareai';

const seedDoctors = [
  {
    fullName: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@hospital.com',
    password: '123456',
    specialization: 'Cardiology',
    phone: '+91 9876543210',
    hospital: 'Apollo Hospital',
    role: 'doctor',
  },
  {
    fullName: 'Dr. Priya Sharma',
    email: 'priya.sharma@hospital.com',
    password: '123456',
    specialization: 'Orthopedics',
    phone: '+91 9876543211',
    hospital: 'Fortis Hospital',
    role: 'doctor',
  },
  {
    fullName: 'Dr. Amit Patel',
    email: 'amit.patel@hospital.com',
    password: '123456',
    specialization: 'General Surgery',
    phone: '+91 9876543212',
    hospital: 'Max Healthcare',
    role: 'doctor',
  },
  {
    fullName: 'Admin User',
    email: 'admin@postcareai.com',
    password: '123456',
    specialization: 'Administration',
    hospital: 'PostCare AI',
    role: 'admin',
  },
];

async function clearCollections() {
  console.log('🗑️  Clearing existing collections...');
  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await Medication.deleteMany({});
  await Alert.deleteMany({});
  await NutritionSchedule.deleteMany({});
  await RecoveryLog.deleteMany({});
  console.log('✅ Collections cleared');
}

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    await clearCollections();

    // 1. Create Doctors (hash passwords manually for insertMany)
    console.log('👨‍⚕️  Creating doctors...');
    const hashedDoctors = await Promise.all(
      seedDoctors.map(async (doc) => ({
        ...doc,
        password: await bcrypt.hash(doc.password, 12),
      }))
    );
    const doctors = await Doctor.insertMany(hashedDoctors);
    doctors.forEach((d) => console.log(`   ✓ ${d.fullName} (${d.email})`));

    // 2. Create Patients
    console.log('\n👥 Creating patients...');
    const patients = [];
    const patientData = [
      { fullName: 'Ramesh Gupta', age: 55, gender: 'Male', phone: '+91 9123456789', surgeryType: 'Heart Bypass', diagnosis: 'Coronary artery disease', status: 'Active', riskLevel: 'Medium' },
      { fullName: 'Sunita Devi', age: 42, gender: 'Female', phone: '+91 9123456790', surgeryType: 'Knee Replacement', diagnosis: 'Osteoarthritis', status: 'Recovered', riskLevel: 'Low' },
      { fullName: 'Vikram Singh', age: 38, gender: 'Male', phone: '+91 9123456791', surgeryType: 'Appendectomy', diagnosis: 'Acute appendicitis', status: 'Active', riskLevel: 'Low' },
      { fullName: 'Lakshmi Nair', age: 67, gender: 'Female', phone: '+91 9123456792', surgeryType: 'Hip Replacement', diagnosis: 'Degenerative joint disease', status: 'Critical', riskLevel: 'High' },
      { fullName: 'Karthik Reddy', age: 45, gender: 'Male', phone: '+91 9123456793', surgeryType: 'Gallbladder removal', diagnosis: 'Cholecystitis', status: 'Discharged', riskLevel: 'Low' },
      { fullName: 'Anita Desai', age: 52, gender: 'Female', phone: '+91 9123456794', surgeryType: 'Cataract surgery', diagnosis: 'Bilateral cataract', status: 'Active', riskLevel: 'Low' },
    ];

    for (let i = 0; i < patientData.length; i++) {
      const data = patientData[i];
      const doctor = doctors[i % doctors.length];
      const patient = await Patient.create({
        doctor: doctor._id,
        ...data,
        address: `${50 + i} Main Street, City`,
        admissionDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * 7),
        operationDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * 5),
        recoveryScore: data.status === 'Recovered' ? 95 : data.status === 'Critical' ? 45 : 70 + i * 5,
      });
      patients.push(patient);
      console.log(`   ✓ ${patient.fullName} - ${patient.surgeryType}`);
    }

    // 3. Create Medications
    console.log('\n💊 Creating medications...');
    const meds = [
      { medicineName: 'Aspirin', dosage: '75mg', frequency: { morning: true, afternoon: false, evening: true }, foodInstruction: 'After Food' },
      { medicineName: 'Metformin', dosage: '500mg', frequency: { morning: true, afternoon: true, evening: true }, foodInstruction: 'With Food' },
      { medicineName: 'Amoxicillin', dosage: '500mg', frequency: { morning: true, afternoon: true, evening: true }, foodInstruction: 'Before Food' },
      { medicineName: 'Paracetamol', dosage: '650mg', frequency: { morning: false, afternoon: true, evening: true }, foodInstruction: 'After Food' },
      { medicineName: 'Omeprazole', dosage: '20mg', frequency: { morning: true, afternoon: false, evening: false }, foodInstruction: 'Before Food' },
    ];

    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const doctor = await Doctor.findById(patient.doctor);
      const numMeds = 1 + (i % 3);
      for (let j = 0; j < numMeds; j++) {
        const med = meds[(i + j) % meds.length];
        await Medication.create({
          patient: patient._id,
          doctor: patient.doctor,
          ...med,
          startDate,
          endDate,
          duration: '30 days',
          isActive: true,
        });
      }
      console.log(`   ✓ ${patient.fullName}: ${numMeds} medication(s)`);
    }

    // 4. Create Alerts
    console.log('\n🚨 Creating alerts...');
    const alertMessages = [
      { severity: 'High', message: 'Patient reported chest pain', type: 'symptom' },
      { severity: 'Medium', message: 'Missed morning medication', type: 'medication' },
      { severity: 'Low', message: 'Mild fever observed', type: 'symptom' },
      { severity: 'High', message: 'Elevated blood pressure', type: 'symptom' },
      { severity: 'Medium', message: 'Swelling at incision site', type: 'symptom' },
    ];

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const alert = alertMessages[i % alertMessages.length];
      await Alert.create({
        patient: patient._id,
        doctor: patient.doctor,
        ...alert,
        resolved: i % 3 === 0,
        resolvedAt: i % 3 === 0 ? new Date() : null,
      });
      console.log(`   ✓ Alert for ${patient.fullName}: ${alert.severity}`);
    }

    // 5. Create Nutrition Schedules
    console.log('\n🍽️  Creating nutrition schedules...');
    const mealItem = (name, calories) => ({ name, quantity: '1 serving', calories, notes: '' });
    for (const patient of patients.slice(0, 4)) {
      await NutritionSchedule.create({
        patient: patient._id,
        doctor: patient.doctor,
        breakfast: [mealItem('Oats', 150), mealItem('Banana', 90)],
        lunch: [mealItem('Rice', 200), mealItem('Dal', 120), mealItem('Vegetables', 80)],
        dinner: [mealItem('Chapati', 70), mealItem('Curry', 100)],
        restrictions: ['Low sugar', 'Low sodium'],
        specialInstructions: 'Small frequent meals recommended',
        startDate: new Date(),
        isActive: true,
      });
      console.log(`   ✓ Nutrition plan for ${patient.fullName}`);
    }

    // 6. Create Recovery Logs
    console.log('\n📋 Creating recovery logs...');
    const moods = ['Good', 'Fair', 'Good', 'Poor', 'Good', 'Fair'];
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      for (let d = 0; d < 5; d++) {
        await RecoveryLog.create({
          patient: patient._id,
          date: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
          painLevel: Math.floor(Math.random() * 4) + (patient.status === 'Critical' ? 5 : 2),
          symptoms: d === 0 ? ['Mild fatigue'] : [],
          medicineAdherence: Math.random() > 0.2,
          mood: moods[i % moods.length],
          vitalSigns: {
            temperature: 36.5 + Math.random() * 1.5,
            bloodPressure: '120/80',
            heartRate: 72 + Math.floor(Math.random() * 20),
            oxygenLevel: 96 + Math.floor(Math.random() * 4),
          },
          source: 'manual',
        });
      }
      console.log(`   ✓ 5 recovery logs for ${patient.fullName}`);
    }

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('✅ SEED COMPLETE!');
    console.log('═'.repeat(50));
    console.log(`   Doctors:     ${doctors.length}`);
    console.log(`   Patients:   ${patients.length}`);
    console.log(`   Medications: ${await Medication.countDocuments()}`);
    console.log(`   Alerts:     ${await Alert.countDocuments()}`);
    console.log(`   Nutrition:  ${await NutritionSchedule.countDocuments()}`);
    console.log(`   Recovery:   ${await RecoveryLog.countDocuments()}`);
    console.log('\n📧 Login credentials (password: 123456 for all roles):');
    seedDoctors.forEach((d) => console.log(`   ${d.email}`));
    console.log('\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
