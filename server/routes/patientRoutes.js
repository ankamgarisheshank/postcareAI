const express = require('express');
const router = express.Router();
const {
    createPatient,
    getPatients,
    getPatient,
    getMyPatientData,
    updatePatient,
    deletePatient,
    uploadPrescription,
    sendEmergency,
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Patient-facing route - must be BEFORE /:id to avoid "me" being treated as an id
router.get('/me', getMyPatientData);

// Doctor-only routes
router.route('/').get(authorize('doctor'), getPatients).post(authorize('doctor'), createPatient);
router.route('/:id').get(authorize('doctor'), getPatient).put(authorize('doctor'), updatePatient).delete(authorize('doctor'), deletePatient);
router.post('/:id/prescription', authorize('doctor'), upload.single('prescription'), uploadPrescription);
router.post('/:id/emergency', authorize('doctor'), sendEmergency);

module.exports = router;
