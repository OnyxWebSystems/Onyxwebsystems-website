# Retell — Custom Functions (copy into dashboard)

Your HTTP tools already exist in this app. In Retell you only **register** them.

## Where to click

On **Onyx Front Desk** → middle column **Functions** → **+ Add** → choose **Custom Function**  
(Do **not** use Cal.com, Code, End Call, etc. for these six.)

Keep the built-in `end_call` function — that one is fine.

You will add **6** Custom Functions. Repeat the same steps for each.

---

## Before you start — public URL

Replace `YOUR_PUBLIC_URL` with your live HTTPS origin (no trailing slash), e.g.:

- `https://abc123.ngrok-free.app`
- or your Vercel URL

Every tool URL looks like:

`https://YOUR_PUBLIC_URL/api/voice/tools/<name>`

If you do not have a public URL yet, pause here, start ngrok/Vercel, then come back.

Optional header on every function (recommended once you set `.env`):

| Header name | Header value |
|-------------|--------------|
| `x-retell-secret` | same value as `RETELL_WEBHOOK_SECRET` in `.env` |

For local testing only you can skip the header and set `RETELL_SKIP_SIGNATURE_VERIFY=true`.

Common settings for **all six**:

- **API endpoint / Method:** `POST`
- **Timeout:** `10000`–`15000` ms (or default)
- **Speak during execution:** optional (off is fine)
- **Speak after execution / Talk after action:** **ON**
- **Parameters:** use the JSON schemas below (Retell usually has a JSON Schema editor)

---

## 1. `lookup_customer`

| Field | Value |
|-------|--------|
| Name | `lookup_customer` |
| Description | Look up an existing customer by phone or email before booking. |
| URL | `https://YOUR_PUBLIC_URL/api/voice/tools/lookup_customer` |

**Parameters (JSON Schema):**

```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "description": "Caller phone number in E.164 or digits"
    },
    "email": {
      "type": "string",
      "description": "Optional customer email"
    }
  },
  "required": ["phone"]
}
```

---

## 2. `check_availability`

| Field | Value |
|-------|--------|
| Name | `check_availability` |
| Description | Get open consultation slots. Default serviceSlug is consultation (30 min). |
| URL | `https://YOUR_PUBLIC_URL/api/voice/tools/check_availability` |

```json
{
  "type": "object",
  "properties": {
    "serviceSlug": {
      "type": "string",
      "description": "Service slug. Use consultation unless the caller asks for app-discovery, web-kickoff, or bos-workshop."
    },
    "days": {
      "type": "number",
      "description": "How many days ahead to search. Default 5."
    }
  },
  "required": []
}
```

---

## 3. `book_appointment`

| Field | Value |
|-------|--------|
| Name | `book_appointment` |
| Description | Book a confirmed consultation after the caller chooses a slot from check_availability. |
| URL | `https://YOUR_PUBLIC_URL/api/voice/tools/book_appointment` |

```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "description": "Customer phone"
    },
    "firstName": {
      "type": "string",
      "description": "Customer first name"
    },
    "lastName": {
      "type": "string",
      "description": "Customer last name"
    },
    "serviceSlug": {
      "type": "string",
      "description": "Usually consultation"
    },
    "startsAt": {
      "type": "string",
      "description": "ISO datetime from the chosen slot (startsAt field)"
    },
    "email": {
      "type": "string",
      "description": "Optional email for confirmation"
    },
    "employeeId": {
      "type": "string",
      "description": "Optional employeeId from the chosen slot"
    },
    "address": {
      "type": "string",
      "description": "Optional address"
    },
    "postalCode": {
      "type": "string",
      "description": "Optional postal code"
    }
  },
  "required": ["phone", "firstName", "lastName", "startsAt"]
}
```

---

## 4. `create_ticket`

| Field | Value |
|-------|--------|
| Name | `create_ticket` |
| Description | Create a support ticket when the caller needs follow-up that is not a simple booking. |
| URL | `https://YOUR_PUBLIC_URL/api/voice/tools/create_ticket` |

```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "description": "Customer phone"
    },
    "subject": {
      "type": "string",
      "description": "Short ticket subject"
    },
    "description": {
      "type": "string",
      "description": "Details of the request"
    },
    "priority": {
      "type": "string",
      "description": "CRITICAL, HIGH, NORMAL, or LOW"
    }
  },
  "required": ["phone", "subject"]
}
```

---

## 5. `escalate`

| Field | Value |
|-------|--------|
| Name | `escalate` |
| Description | Escalate to a human for complaints, security issues, legal/payment disputes, or when the caller asks for a person. |
| URL | `https://YOUR_PUBLIC_URL/api/voice/tools/escalate` |

```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "description": "Customer phone"
    },
    "reason": {
      "type": "string",
      "description": "Why this is being escalated"
    },
    "summary": {
      "type": "string",
      "description": "Short conversation summary for the team"
    },
    "urgency": {
      "type": "string",
      "description": "CRITICAL, HIGH, NORMAL, or LOW"
    }
  },
  "required": ["phone", "reason", "summary"]
}
```

---

## 6. `search_knowledge`

| Field | Value |
|-------|--------|
| Name | `search_knowledge` |
| Description | Answer FAQs from the approved Onyx knowledge base (hours, services, pricing philosophy, portfolio, policies). Never invent fees. |
| URL | `https://YOUR_PUBLIC_URL/api/voice/tools/search_knowledge` |

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "What the caller is asking about"
    }
  },
  "required": ["query"]
}
```

---

## After all six are added

1. Click **Publish** on the agent.
2. Confirm Functions list shows: `end_call` + the six names above.
3. Set **Webhook Settings** to:  
   `https://YOUR_PUBLIC_URL/api/webhooks/retell`  
   (events: call started / ended / analyzed).
4. Assign a phone number to this agent.
5. Put keys in `.env`:

```env
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_PHONE_NUMBER=+1...
RETELL_WEBHOOK_SECRET=
PUBLIC_APP_URL=https://YOUR_PUBLIC_URL
```

---

## What these tools are (plain English)

| Tool | What it does in *your* system |
|------|-------------------------------|
| `lookup_customer` | Finds the caller in Neon CRM |
| `check_availability` | Reads internal calendar slots |
| `book_appointment` | Creates appointment + optional email |
| `create_ticket` | Opens a ticket in the CX dashboard |
| `escalate` | Escalation + ticket for a human |
| `search_knowledge` | Answers from Onyx KB articles |

You are **not** inventing tools in Retell — Retell only calls these URLs when the agent needs them.
