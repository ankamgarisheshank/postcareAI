const express = require('express');
const router = express.Router();
const {
    createPatient,
    getPatients,
    getPatient,
    updatePatient,
    deletePatient,
    uploadPrescription,
    sendEmergency,
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

router.route('/').get(getPatients).post(createPatient);
router.route('/:id').get(getPatient).put(updatePatient).delete(deletePatient);
router.post('/:id/prescription', upload.single('prescription'), uploadPrescription);
router.post('/:id/emergency', sendEmergency);

module.exports = router;
