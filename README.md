# RFP Management System
<p align="left"> <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square" /> <img src="https://img.shields.io/badge/Express.js-Backend-blue?style=flat-square" /> <img src="https://img.shields.io/badge/React-Frontend-61DBFB?style=flat-square" /> <img src="https://img.shields.io/badge/MongoDB-Database-brightgreen?style=flat-square" /> <img src="https://img.shields.io/badge/Ollama-AI%20Parser-orange?style=flat-square" /> <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" /> </p>
AI-assisted **Request for Proposal (RFP)** management system that enables buyers to:

- Write RFPs in natural language and convert them into structured specs.
- Manage vendors and send RFP emails.
- Poll an email inbox for vendor replies.
- Parse proposals using an LLM, score them, and generate comparison & recommendations.

---

## 🚀 Features

- Natural-language → structured RFP generation
- Automated vendor email sending
- IMAP inbox polling for proposal replies
- LLM-powered proposal parsing
- Weighted scoring engine
- Comparison dashboard with recommendations
- MERN-stack based (MongoDB, Express, React, Node)

---

## 📦 Prerequisites

- **Node.js** v18+  
- **npm** (bundled with Node)
- **MongoDB** (local or Atlas)
- **Email provider**  
  - Gmail with App Password
- **AI Provider**  
  - Ollama Cloud API key

---

## 📁 Repository Structure

```bash
rfp-management-system/
  backend/
    src/
      config/
      controllers/
      routes/
      services/
      models/
      middleware/
      utils/
  frontend/
    src/
      app/
      pages/
      components/
```

---

# 🖥️ Backend Setup

## 1. Clone & Install

```bash
git clone <your-repo-url> rfp-management-system
cd rfp-management-system/backend
npm install
```

---

## 2. Environment Variables

Create a file: `backend/.env`

```env
# Server
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rfp-management

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173

# Gmail / IMAP
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# AI (Ollama Cloud or Local)
OLLAMA_HOST=https://ollama.com        # or http://localhost:11434 for local
OLLAMA_API_KEY=ollama-xxxxxxxxxxxxxxx # remove if local
LLM_MODEL=gpt-oss:120b                # or llama3.1, etc.

# Email Polling
EMAIL_LOOKBACK_HOURS=24
```

---

## 3. Run Backend

```bash
npm run dev
```

On startup, backend:

- Connects to MongoDB
- Optionally runs seed scripts (if enabled)
- Initializes Express routes & middleware

**Key files:**

- `server.js` — Bootstraps server, DB, optional seed
- `src/app.js` — Express app
- `src/config/database.js` — Mongoose config

---

# 🌐 Frontend Setup

From project root:

```bash
cd frontend
npm install
npm run dev
```

Assumptions:

- React app (Vite) → http://localhost:5173
- RTK Query base URL:

```ts
baseQuery: fetchBaseQuery({
  baseUrl: 'http://localhost:5000/api',
});
```

### Main Pages

| Path | Description |
|------|-------------|
| `/rfps/new` | Create RFP from natural language |
| `/vendors` | Vendor management |
| `/rfps/:rfpId/proposals` | View & poll proposals |
| `/rfps/:rfpId/compare` | Compare proposals & recommendation |

---

# 📧 Email Sending & IMAP Polling

## Sending RFPs

Uses **nodemailer** with Gmail SMTP.

- Controller: `rfp.controller.js → sendToVendors`
- Service: `email.service.js → sendRFPToVendors()`

Subject format:

```
Request for Proposal: <RFP Title> <RFP_OBJECT_ID>
```

Example:

```
Request for Proposal: Procurement of laptops and monitors 6932f18e32f49f92f93b7652
```

The ObjectId links vendor replies to the correct RFP.

---

## Polling IMAP Inbox

**Service:** `email.service.js → pollIncomingEmails()`

Steps:

1. Connect to IMAP  
2. Search **UNSEEN** emails, limited by `EMAIL_LOOKBACK_HOURS`  
3. Extract:
   - Vendor email
   - RFP ObjectId from subject
   - Body & attachments  
4. Create proposal using:  
   ```ts
   proposal.service.createFromEmail(parsedEmail, rfpId, vendorId)
   ```

**Endpoint:**

```http
POST /api/proposals/poll-emails
```

Response:

```json
{
  "success": true,
  "message": "Found 1 new proposal(s)!",
  "newProposals": 1
}
```

Frontend calls this to fetch new proposals.

---

# 🏃 Running the Entire System Locally

### 1. Start MongoDB
- Run `mongod`, or  
- Use Docker, or  
- Use MongoDB Atlas

### 2. Start Backend

```bash
cd backend
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

---

# 🔁 End-to-End Workflow

1. Go to **/vendors** → create or seed vendors  
2. Go to **/rfps/new** → generate RFP from natural text  
3. Go to **/rfps/:id/proposals** → send RFP to selected vendors  
4. Vendor replies via email → keeping RFP ID in subject  
5. Frontend → click **Poll Emails**  
6. Proposals appear with parsed data + AI scores  
7. Go to **/rfps/:id/compare** → view comparison & recommendation  

---

# 🌱 Seed Data

Located in `src/utils/seedData.js`.

Seeds:

- 3–8 vendors  
- 1 sample RFP  
- Optional sample proposals  

Trigger manually (if wired):

```bash
npm run seed
```

---

# 🧰 Tech Stack

### **Frontend**
- React (Vite)
- TypeScript / JavaScript
- Redux Toolkit / RTK Query
- react-router-dom

### **Backend**
- Node.js + Express
- Mongoose (MongoDB)
- nodemailer
- imap + mailparser
- node-cron (optional)

### **Database (MongoDB)**
Relationships:

- `RFP.vendors → Vendor._id[]`
- `RFP.proposals → Proposal._id[]`
- `Proposal.vendorId`, `Proposal.rfpId`
- `Vendor.previousProposals`

### **AI Provider**
- Ollama Cloud (default)
- Local Ollama / other LLMs (pluggable)

### **Email**
Supports any provider with:

- SMTP (sending)
- IMAP (reading)

---

# 📘 API Documentation

## RFP

### **POST /api/rfp/create-from-text**

```json
{ "text": "We need 20 laptops with 16GB RAM and 15 monitors..." }
```

### **GET /api/rfp/:id**

Returns RFP with vendors & proposals.

### **GET /api/rfps**

List RFPs.

### **POST /api/rfp/:id/send-to-vendors**

```json
{ "vendorIds": ["64f8...", "64f9..."] }
```

---

## Vendors

### **GET /api/vendors**

### **POST /api/vendors**

```json
{
  "name": "TechNova Systems",
  "email": "sales@technova-systems.com",
  "contactPerson": "Alice Johnson",
  "phone": "+1-415-555-1020"
}
```

Duplicate email:

```json
{ "error": "Vendor with email ... already exists" }
```

---

## Proposals

### **GET /api/proposals/by-rfp/:rfpId**

Returns proposals + parsed data + scoring.

### **POST /api/proposals/poll-emails**

Triggers IMAP polling.

---

## Comparison

### **GET /api/comparison/:rfpId**

Returns:

- proposals  
- scoring  
- recommended vendor  
- analysis  

---

# 🧠 Decisions & Assumptions

### Data Model

- RFP stores normalized structured specs  
- Vendor stores history  
- Proposal stores:
  - raw email
  - parsed JSON
  - AI scoring (cached)

### IMAP / Email Assumptions

- Only **UNSEEN** messages processed  
- Vendor identified via `from.address`
- RFP ID extracted from subject
- Text-based attachments appended for parsing

### Scoring (Weighted)

| Metric | Weight |
|--------|--------|
| Price | 30% |
| Delivery | 25% |
| Compliance | 35% |
| Support | 10% |

---

# 🤖 AI Tools Used During Development

### Tools
- ChatGPT  
- GPT-4/5 class models  
- Copilot-like autocompletion  

### Contributions
- Architectural guidance  
- Boilerplate code generation  
- IMAP parsing logic  
- Proposal scoring framework  
