const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { PRESCRIPTION_PARSE_PROMPT, MESSAGE_CLASSIFY_PROMPT } = require('../config/constants');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parse prescription file using Gemini Vision
 * @param {string} filePath - Path to the prescription image/PDF
 * @returns {Array} Parsed medications
 */
const parsePrescription = async (filePath) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Read file and convert to base64
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        const ext = path.extname(filePath).toLowerCase();

        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.pdf') mimeType = 'application/pdf';

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType,
            },
        };

        const result = await model.generateContent([PRESCRIPTION_PARSE_PROMPT, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // Try parsing entire response as JSON
        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini prescription parsing error:', error.message);
        throw new Error('Failed to parse prescription using AI');
    }
};

/**
 * Classify patient message severity using Gemini
 * @param {string} message - Patient message text
 * @returns {Object} Classification result with severity and summary
 */
const classifyMessage = async (message) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = MESSAGE_CLASSIFY_PROMPT + `"${message}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { severity: 'Low', summary: message };
    } catch (error) {
        console.error('Gemini classification error:', error.message);
        return { severity: 'Medium', summary: message };
    }
};

module.exports = { parsePrescription, classifyMessage };
