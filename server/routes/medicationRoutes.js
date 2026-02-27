const express = require('express');
const router = express.Router();
const {
    addMedication,
    getMedications,
    updateMedication,
    deleteMedication,
    bulkAddMedications,
} = require('../controllers/medicationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', addMedication);
router.post('/bulk', bulkAddMedications);
router.get('/:patientId', getMedications);
router.route('/:id').put(updateMedication).delete(deleteMedication);

module.exports = router;
