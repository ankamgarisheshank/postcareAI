module.exports = {
    // Gemini prompt for prescription parsing
    PRESCRIPTION_PARSE_PROMPT:
        'Extract medicine name, dosage, frequency, duration, and food instructions from the following prescription text. Return the result in strict JSON array format like: [{"medicineName": "...", "dosage": "...", "frequency": "...", "duration": "...", "foodInstructions": "..."}]. Only return the JSON array, no other text.',

    // Gemini prompt for message classification
    MESSAGE_CLASSIFY_PROMPT:
        'You are a medical AI assistant. Classify the following patient message into one of these severity levels: "Low", "Medium", or "High". Also extract a short summary. Return in strict JSON format: {"severity": "...", "summary": "..."}. Patient message: ',

    // Alert severities
    SEVERITY: {
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High',
    },

    // Medication schedule times
    MED_TIMES: {
        MORNING: '08:00',
        AFTERNOON: '13:00',
        EVENING: '20:00',
    },

    // Roles
    ROLES: {
        DOCTOR: 'doctor',
        ADMIN: 'admin',
    },
};
