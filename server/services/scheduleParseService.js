/**
 * OpenRouter agent: parse natural language → datetime for scheduling
 * e.g. "today 06 35 am" → 2025-02-28T06:35:00
 * e.g. "tomorrow 8 pm" → 2025-03-01T20:00:00
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const parseScheduleTime = async (userInput) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return { success: false, error: 'OPENROUTER_API_KEY not configured' };
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const prompt = `You are a schedule parser. Parse natural language time into a future datetime.
Current date/time: ${now.toISOString()}
Today: ${todayStr}

Examples (output datetime in YYYY-MM-DDTHH:mm:ss, 24-hour):
- "today 6 35 am" or "today 06 35 am" → 6:35 AM today
- "today 6 35 pm" or "today 06 35 pm" → 6:35 PM today (18:35)
- "today 8 am" → 8:00 AM today
- "today 8 pm" → 8:00 PM today (20:00)
- "tomorrow 9 am" → 9:00 AM tomorrow
- "tomorrow 6 30 pm" → 6:30 PM tomorrow

User input: "${(userInput || '').trim()}"

Respond with ONLY this JSON, no other text:
{"datetime":"YYYY-MM-DDTHH:mm:ss","label":"e.g. Today 6:35 PM"}`;

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
                temperature: 0.1,
            }),
        });

        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content?.trim();

        if (!content) {
            return { success: false, error: data?.error?.message || 'No response' };
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { success: false, error: 'Invalid response format' };

        const parsed = JSON.parse(jsonMatch[0]);
        const dt = parsed.datetime; // e.g. "2025-02-28T06:35:00" or "2025-02-28T18:35:00"

        if (!dt) return { success: false, error: 'No datetime in response' };

        // Ensure we have a valid ISO string for datetime-local (YYYY-MM-DDTHH:mm)
        const scheduledAt = dt.length >= 16 ? dt.slice(0, 16) : dt;
        const date = new Date(scheduledAt);

        if (isNaN(date.getTime())) return { success: false, error: 'Invalid datetime' };
        if (date <= new Date()) return { success: false, error: 'Time must be in the future' };

        return {
            success: true,
            scheduledAt: date.toISOString(),
            datetimeLocal: date.toISOString().slice(0, 16),
            label: parsed.label || date.toLocaleString(),
        };
    } catch (err) {
        console.error('❌ Schedule parse error:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = { parseScheduleTime };
