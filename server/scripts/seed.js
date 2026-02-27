/**
 * PostCare AI - Database Seed Script (Unified Schema)
 * Uses User model (replaces Doctor) + Prescription (replaces Medication) + DailyLog (replaces RecoveryLog)
 * 
 * Usage: npm run seed (from server directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Alert = require('../models/Alert');
const NutritionSchedule = require('../models/NutritionSchedule');
const DailyLog = require('../models/DailyLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dheeraxgamerz_db_user:WgS7xhmhDdywGRK0@cluster0.efhgprs.mongodb.net/patient-followup';

const geocodeAddress = async (address) => {
    try {
        if (!address) return null;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'PostCareAI/1.0' } });
        const data = await response.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), formattedAddress: data[0].display_name };
    } catch (e) { console.warn('Geocode failed:', e.message); }
    return null;
};

const seedUsers = [
    {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@hospital.com',
        phone: '+917780658357',
        password: '123456',
        specialization: 'Cardiology',
        hospital: 'Apollo Hospital',
        role: 'doctor',
    },
    {
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@hospital.com',
        phone: '+919876543211',
        password: '123456',
        specialization: 'Orthopedics',
        hospital: 'Fortis Hospital',
        role: 'doctor',
    },
    {
        name: 'Dr. Amit Patel',
        email: 'amit.patel@hospital.com',
        phone: '+919876543212',
        password: '123456',
        specialization: 'General Surgery',
        hospital: 'Max Healthcare',
        role: 'doctor',
    },
    {
        name: 'Admin User',
        email: 'admin@postcareai.com',
        password: '123456',
        specialization: 'Administration',
        hospital: 'PostCare AI',
        role: 'admin',
    },
];

const seedPatientUser = {
    name: 'Ramesh Gupta',
    email: 'ramesh.gupta@gmail.com',
    phone: '+917842340586',
    password: '123456',
    role: 'patient',
};

async function clearCollections() {
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Prescription.deleteMany({});
    await Alert.deleteMany({});
    await NutritionSchedule.deleteMany({});
    await DailyLog.deleteMany({});
    console.log('Collections cleared');
}

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB\n');

        await clearCollections();

        // 1. Create Users (doctors)
        console.log('Creating doctors...');
        const hashedUsers = await Promise.all(
            seedUsers.map(async (u) => ({
                ...u,
                password: await bcrypt.hash(u.password, 10),
            }))
        );
        const users = await User.insertMany(hashedUsers);
        users.forEach((u) => console.log('  + ' + u.name + ' (' + (u.email || u.phone) + ')'));

        // 1b. Create Patient User
        console.log('\nCreating patient user...');
        const patientUser = await User.create({
            ...seedPatientUser,
            // password will be hashed by pre-save hook — do NOT pre-hash
        });
        console.log('  + ' + patientUser.name + ' (' + patientUser.phone + ') [patient]');

        // 2. Create Patients
        console.log('\nCreating patients...');
        const patients = [];
        const patientData = [
            { name: 'Ramesh Gupta', age: 55, gender: 'Male', phone: '+917842340586', surgeryType: 'Heart Bypass', diagnosis: 'Coronary artery disease', status: 'Active', riskLevel: 'Medium', riskStatus: 'monitor' },
            { name: 'Sunita Devi', age: 42, gender: 'Female', phone: '+919123456790', surgeryType: 'Knee Replacement', diagnosis: 'Osteoarthritis', status: 'Recovered', riskLevel: 'Low', riskStatus: 'stable' },
            { name: 'Vikram Singh', age: 38, gender: 'Male', phone: '+919123456791', surgeryType: 'Appendectomy', diagnosis: 'Acute appendicitis', status: 'Active', riskLevel: 'Low', riskStatus: 'stable' },
            { name: 'Lakshmi Nair', age: 67, gender: 'Female', phone: '+919123456792', surgeryType: 'Hip Replacement', diagnosis: 'Degenerative joint disease', status: 'Critical', riskLevel: 'High', riskStatus: 'critical' },
            { name: 'Karthik Reddy', age: 45, gender: 'Male', phone: '+919123456793', surgeryType: 'Gallbladder removal', diagnosis: 'Cholecystitis', status: 'Discharged', riskLevel: 'Low', riskStatus: 'stable' },
            { name: 'Anita Desai', age: 52, gender: 'Female', phone: '+919123456794', surgeryType: 'Cataract surgery', diagnosis: 'Bilateral cataract', status: 'Active', riskLevel: 'Low', riskStatus: 'stable' },
        ];

        const addresses = ['Hyderabad, Telangana, India', 'Mumbai, Maharashtra, India', 'Bangalore, Karnataka, India', 'Chennai, Tamil Nadu, India', 'Delhi, India', 'Pune, Maharashtra, India'];
        for (let i = 0; i < patientData.length; i++) {
            const data = patientData[i];
            const doctor = users[i % users.length];
            const address = addresses[i % addresses.length];
            const location = await geocodeAddress(address);
            const patient = await Patient.create({
                doctor: doctor._id,
                assignedDoctor: doctor.name,
                doctorPhone: doctor.phone || '',
                ...data,
                address,
                location: location || undefined,
                admissionDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * 7),
                surgeryDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * 5),
                operationDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * 5),
                recoveryScore: data.status === 'Recovered' ? 95 : data.status === 'Critical' ? 45 : 70 + i * 5,
            });
            patients.push(patient);
            console.log('  + ' + patient.name + ' - ' + patient.surgeryType + (location ? ' [mapped]' : ''));
        }

        // Link patient user to patient record
        patientUser.linkedPatientId = patients[0]._id;
        await patientUser.save();
        console.log('  Linked ' + patientUser.name + ' user -> patient record');

        // 3. Create Prescriptions
        console.log('\nCreating prescriptions...');
        const meds = [
            { drugName: 'Aspirin', dosage: '75mg', frequency: 'Twice daily', instructions: 'After Food' },
            { drugName: 'Metformin', dosage: '500mg', frequency: 'Three times daily', instructions: 'With Food' },
            { drugName: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', instructions: 'Before Food' },
            { drugName: 'Paracetamol', dosage: '650mg', frequency: 'Twice daily', instructions: 'After Food' },
            { drugName: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', instructions: 'Before Food' },
        ];

        const startDate = new Date();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            const numMeds = 1 + (i % 3);
            for (let j = 0; j < numMeds; j++) {
                const med = meds[(i + j) % meds.length];
                await Prescription.create({
                    patientId: patient._id,
                    doctor: patient.doctor,
                    ...med,
                    startDate,
                    endDate,
                    isActive: true,
                });
            }
            console.log('  + ' + patient.name + ': ' + numMeds + ' prescription(s)');
        }

        // 4. Create Alerts
        console.log('\nCreating alerts...');
        const alertMessages = [
            { severity: 'high', title: 'Chest Pain', message: 'Patient reported chest pain', type: 'red_flag' },
            { severity: 'medium', title: 'Missed Medication', message: 'Missed morning medication', type: 'medication_missed' },
            { severity: 'low', title: 'Mild Fever', message: 'Mild fever observed', type: 'symptom' },
            { severity: 'high', title: 'Blood Pressure', message: 'Elevated blood pressure', type: 'red_flag' },
            { severity: 'medium', title: 'Swelling', message: 'Swelling at incision site', type: 'symptom' },
        ];

        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            const alert = alertMessages[i % alertMessages.length];
            await Alert.create({
                patientId: patient._id,
                doctor: patient.doctor,
                ...alert,
                isRead: i % 3 === 0,
                resolved: i % 3 === 0,
                resolvedAt: i % 3 === 0 ? new Date() : null,
            });
            console.log('  + Alert for ' + patient.name + ': ' + alert.severity);
        }

        // 5. Create Nutrition Schedules
        console.log('\nCreating nutrition schedules...');
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
            console.log('  + Nutrition plan for ' + patient.name);
        }

        // 6. Create DailyLogs
        console.log('\nCreating daily logs...');
        const moods = ['good', 'okay', 'good', 'bad', 'good', 'okay'];
        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            for (let d = 0; d < 5; d++) {
                await DailyLog.create({
                    patientId: patient._id,
                    date: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
                    painLevel: Math.floor(Math.random() * 4) + (patient.status === 'Critical' ? 5 : 2),
                    temperature: 36.5 + Math.random() * 1.5,
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
                    loggedBy: 'doctor',
                });
            }
            console.log('  + 5 daily logs for ' + patient.name);
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('SEED COMPLETE!');
        console.log('='.repeat(50));
        console.log('  Users:         ' + users.length);
        console.log('  Patients:      ' + patients.length);
        console.log('  Prescriptions: ' + await Prescription.countDocuments());
        console.log('  Alerts:        ' + await Alert.countDocuments());
        console.log('  Nutrition:     ' + await NutritionSchedule.countDocuments());
        console.log('  DailyLogs:     ' + await DailyLog.countDocuments());
        console.log('\nLogin credentials (password: 123456 for all):');
        console.log('  DOCTOR:  +917780658357 or rajesh.kumar@hospital.com');
        console.log('  PATIENT: +917842340586 or ramesh.gupta@gmail.com');
        seedUsers.slice(1).forEach((u) => console.log('  ' + u.email));
        console.log('');

    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

seed();
