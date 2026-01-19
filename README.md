# AI Chatbot

An AI-powered chatbot application designed to provide conversational assistance using modern web technologies and API-driven architecture. This project focuses on clean frontend integration, scalable backend communication, and practical AI usage patterns.

---

## 🚀 Overview

This project demonstrates the implementation of an AI chatbot with an emphasis on:
- Modular frontend architecture
- API-based AI integration
- Maintainable and extensible design
- Real-world usage patterns rather than experimental demos

The chatbot can be extended to support use cases such as customer support, internal tooling, knowledge assistants, or automation workflows.

---

## 🛠️ Tech Stack

**Frontend**
- TypeScript
- Modern JavaScript framework (React / Next.js)

**Backend & AI**
- Node.js
- REST APIs
- OpenAI / LLM-based integration

**Tooling**
- Git & GitHub
- Environment-based configuration
- Modular code structure

---

## ✨ Features

- Conversational AI interaction using LLM APIs
- Clean separation between UI and AI logic
- Reusable and extensible prompt handling
- API-based request/response flow
- Configurable environment setup for API keys
- Designed for scalability and future enhancements

### Contract Analyzer (Demo / Educational)

- Structured risk analysis for pasted contract text (ToS, NDA, SaaS, etc.)
- Evidence-backed findings with quoted snippets and locations
- Risk score, risk level, confidence, and most risky areas
- Clause table with pushback and suggested redlines
- Missing/weak clauses and questions to ask
- Metrics footer: model, tokens, latency, cost, retry count

---

## 📐 Architecture Highlights

- Frontend communicates with backend services via REST APIs
- AI logic is abstracted to allow swapping or extending models
- Stateless request handling for scalability
- Clear separation of concerns for maintainability

### Tech Choices Rationale

- **Zod for Validation**: Ensures LLM outputs match strict schemas, catching invalid JSON and protecting downstream consumers. Mirrors enterprise schema enforcement used in regulated domains.
- **Retry + Backoff**: Auto-retry once or twice on invalid responses to reduce transient failures; standard production reliability pattern.
- **Evidence Requirement**: Every risk claim must include at least one quote from input, improving traceability and user trust.
- **Regex Guardrails**: Basic SSN/email/phone/profanity detection on the client to avoid sensitive data usage in demos.
- **generateObject**: Structured generation with schema guidance for consistency over free-text outputs.

---

## 🧪 Use Cases

- AI-powered customer support chatbot
- Internal productivity or knowledge assistant
- Proof-of-concept for AI-driven applications
- Foundation for integrating AI into larger platforms

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- API key for the AI provider

### Installation
```bash
git clone git@github.com:kiran-revally-unh/kiran-ai-chatbot.git
cd kiran-ai-chatbot
npm install

### Run (Dev)
```bash
npm run dev
# Open http://localhost:3000/contract-analyzer
```

### Example Flow
- Open Contract Analyzer from the sidebar
- Paste sample/public text or use Sample Loader
- Select contract type, jurisdiction, persona
- Click Analyze to get structured results with evidence and metrics

### Safety Note
This tool is educational and not legal advice. Use only sample or public contract text.
