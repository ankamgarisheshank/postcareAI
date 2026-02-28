/**
 * Quick test: send "hi hello how are you" to the LLM and print the output
 * Run: node scripts/test-llm.js
 */
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const TEST_MESSAGE = 'hi hello how are you';

async function testLLM() {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set in .env');
        process.exit(1);
    }

    console.log('📤 Sending to LLM:', TEST_MESSAGE);
    console.log('---');

    try {
        const resp = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are PostCareAI, a friendly medical follow-up assistant. Respond briefly and warmly.\n\nUser: ${TEST_MESSAGE}`,
                    }],
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256,
                },
            }),
        });

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            console.log('📥 LLM Response:\n');
            console.log(text);
            console.log('\n---');
            console.log('✅ Test passed');
        } else {
            console.error('❌ No text in response:', JSON.stringify(data, null, 2));
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

testLLM();
