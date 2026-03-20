# VAPI Webhook Setup for Call Logs

To receive call transcripts and generate AI summaries, configure VAPI to send end-of-call reports to your server.

## 1. Webhook URL

Your endpoint:
```
https://your-domain.com/api/webhook/vapi
```

For local dev with ngrok:
```
https://xxxx.ngrok.io/api/webhook/vapi
```

## 2. VAPI Dashboard Configuration

1. Go to [VAPI Dashboard](https://dashboard.vapi.ai) → Your Assistant
2. Under **Server URL** (or **Server Messages**), add:
   - **URL:** `https://your-domain.com/api/webhook/vapi`
   - **Server Messages:** Enable `end-of-call-report`
3. Save

## 3. What Happens

When a call ends, VAPI POSTs to your webhook with:
- `transcript` — full conversation
- `endedReason` — why the call ended
- `recording` — URL to the recording

Your server will:
1. Save the transcript to CallLog
2. Use OpenRouter to summarize the call for the doctor
3. Store the summary in CallLog

## 4. Call Logs Page

Doctors see all call logs at **Call Logs** in the sidebar, with:
- Patient name
- Call time
- AI summary (what happened in the call)
- Full transcript (expandable)
- Recording link (if available)
