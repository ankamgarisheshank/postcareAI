/**
 * OpenRouter: summarize call transcript for medical context
 */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const summarizeCall = async (transcript, patientName = 'Patient') => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return 'Summary not available (OpenRouter not configured).';
    }

    if (!transcript?.trim()) {
        return 'No transcript available.';
    }

    const prompt = `You are a medical assistant. Summarize this call transcript for a doctor in 2-4 sentences.

Focus on:
- What language the patient chose
- Key points discussed (medication reminder, understanding, etc.)
- Patient's response (understood, questions, concerns)
- Any follow-up needed

Patient: ${patientName}

Transcript:
${transcript.substring(0, 4000)}

Summary:`;

    try {
        const resp = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            }),
        });

        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        return text || 'Summary generation failed.';
    } catch (err) {
        console.error('❌ Call summary error:', err.message);
        return 'Summary generation failed.';
    }
};

module.exports = { summarizeCall };
