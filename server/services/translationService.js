/**
 * OpenRouter translation service
 * Translates English medical reminders to native Telugu and Hindi script.
 * Modern voice models (GPT-4o, etc.) handle Unicode natively — sounds 10x more natural than romanized.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const translateMessage = async (englishText) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OpenRouter not configured: missing OPENROUTER_API_KEY');
        return {
            english: englishText?.trim() || '',
            teluguMessage: englishText?.trim() || '',
            hindiMessage: englishText?.trim() || '',
        };
    }

    const prompt = `Translate the following medical reminder message into natural Telugu and natural Hindi.

IMPORTANT: Use NATIVE script only — NOT romanized/pronunciation.
- Telugu: Use Telugu script (e.g. మీ మందు రాత్రి 8 గంటలకు తీసుకోండి)
- Hindi: Use Devanagari script (e.g. अपनी दवा रात 8 बजे लीजिए)

English message:
"${(englishText || '').trim()}"

Respond with ONLY a valid JSON object, no other text:
{"english":"...","telugu":"...","hindi":"..."}`;

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.APP_URL || 'https://postcare.ai',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            }),
        });

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim();

        if (!content) {
            throw new Error(data?.error?.message || 'No translation response');
        }

        // Parse JSON from response (handle markdown code blocks)
        let parsed;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            parsed = JSON.parse(content);
        }

        return {
            english: parsed.english || englishText?.trim() || '',
            teluguMessage: parsed.telugu || parsed.teluguMessage || englishText?.trim() || '',
            hindiMessage: parsed.hindi || parsed.hindiMessage || englishText?.trim() || '',
        };
    } catch (error) {
        console.error('❌ Translation error:', error.message);
        return {
            english: englishText?.trim() || '',
            teluguMessage: englishText?.trim() || '',
            hindiMessage: englishText?.trim() || '',
        };
    }
};

module.exports = { translateMessage };
