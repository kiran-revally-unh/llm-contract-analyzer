# Technical Report: Coco Contract Risk Analyzer

**Version:** 1.0  
**Date:** January 2026  
**Author:** Kiran Revally

---

## Executive Summary

**Coco** is an AI-powered contract analysis platform that transforms complex legal documents into structured, actionable risk insights. It uses OpenAI's GPT-4o to analyze employment agreements, Terms of Service, NDAs, and lease contracts, providing plain-English explanations, risk scores, negotiation strategies, and evidence-backed findings—all in under 15 seconds.

**Core Value Proposition:** Enable non-lawyers to understand contract risks, identify unfair terms, and negotiate confidently without needing legal expertise.

---

## Product Overview

### What It Does

Coco analyzes legal contracts to:
1. **Identify risky clauses** - Finds problematic terms like non-competes, broad liability waivers, aggressive IP transfers
2. **Extract evidence** - Quotes exact contract language with section references
3. **Explain in plain English** - Translates legalese into understandable summaries
4. **Score risk** - Calculates 0-100 risk score based on clause severity, missing protections, and power imbalance
5. **Suggest negotiations** - Provides specific pushback language and suggested revisions
6. **Flag missing clauses** - Identifies standard protections that should exist but don't

**Supported Contract Types:**
- Employment offers & employment agreements
- SaaS Terms of Service & Privacy Policies
- Non-Disclosure Agreements (NDAs)
- Commercial & residential lease agreements
- General business contracts

---

## User Flow (End-to-End)

### 1. Home Page (Contract Input)

**URL:** `/`

**User Actions:**
- Select contract type from 4 preset cards (Employment, TOS, NDA, Lease)
- Choose input method:
  - **Type/Paste** - Direct text input in textarea
  - **Drag & Drop** - Drop file onto designated area
  - **Upload** - Click "Attach Contract" to select PDF/DOCX/TXT file
  - **Clipboard** - Paste from clipboard (detects files)

**File Processing:**
- PDF files → Sent to `/api/extract-pdf` → `pdf2json` extracts text server-side
- DOCX files → `mammoth` library extracts text client-side
- TXT files → Read directly as UTF-8 text

**Validation:**
- Minimum 50 characters required
- Maximum ~200KB file size
- Shows "Processing file..." spinner during extraction
- Error alerts for corrupted/protected files

**Navigation:**
- On submit → Redirects to `/contract-analyzer?type=employment_offer&text=...`
- Contract text passed via URL query params (encoded)

---

### 2. Analysis Processing

**URL:** `/contract-analyzer?type=X&text=Y`

**Auto-trigger:**
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const text = params.get('text');
  
  if (type && text) {
    setTimeout(() => analyzeContract(text, type), 100);
  }
}, []);
```

**Loading State:**
- Full-screen "Analysis in Progress" overlay
- 4 animated progress steps:
  1. ✓ Scanning contract structure
  2. ✓ Identifying risk clauses
  3. ✓ Analyzing legal language
  4. → Generating recommendations

**API Call:**
```typescript
POST /api/contract/analyze
Body: {
  contractText: string,
  contractType: 'employment_offer' | 'tos' | 'nda' | 'lease' | 'other',
  jurisdiction: 'us_general' | 'ca' | 'ny' | 'other',
  persona: 'founder' | 'company' | 'user' | 'employee',
  modelId: 'gpt-4o'
}
```

**Processing Time:** 5-15 seconds (depends on contract length)

---

### 3. Results Dashboard

**Layout:**
- **Top:** Summary strip with 5 key metrics
- **Left (33%):** Original document preview (sticky, scrollable)
- **Right (67%):** Risk analysis grouped by category

**Summary Strip Metrics:**
1. **Risk Score** - 0-100 calculated score
2. **Contract Type** - Detected type (may differ from user selection)
3. **High-Risk Items** - Count of clauses marked "high"
4. **Favors** - Who benefits most (Company/User/Balanced)
5. **Confidence** - AI confidence percentage (0-100%)

**Risk Category Cards:**

Categories displayed:
- Termination & Exit
- IP Ownership
- Non-compete / Restrictions
- Dispute Resolution (Arbitration)
- Liability & Damages
- Payment / Fees
- Data Privacy / Usage
- Warranties & Disclaimers
- Governing Law
- Confidentiality (NDA)
- Other Terms

Each card shows:
- **Header:** Category name + Risk badge (Low/Med/High) + Confidence %
- **Summary:** 1-2 line plain-English explanation
- **Expandable Details:**
  - "Why It Matters" - Real-world impact explanation
  - "Evidence from Contract" - 2-4 exact quotes with locations
  - "Who Benefits" - Company/User/Neutral badge
  - "Market Standard" - Standard/Aggressive/Unusual badge
  - "What to Negotiate" - 3 bullet points with pushback strategies

**Actions:**
- "Save to Report" - Add to downloadable report
- "Add Note" - Attach personal notes
- "Export PDF/JSON" - Download full analysis
- "Generate Negotiation Email" - Create draft email with key points

**Missing Clauses Section:**
- Yellow warning card at bottom
- Lists expected clauses that don't exist
- Shows why each matters + recommended language

---

### 4. Export & Share

**Export Formats:**

1. **JSON Export:**
```json
{
  "analysis": {
    "overall": { "risk_score": 72, "confidence": 0.89, ... },
    "clauses": [ { "category": "liability", "risk": "high", ... } ],
    "missing_or_weak_clauses": [ ... ],
    "recommendations": [ ... ]
  },
  "metadata": {
    "processingTime": 8234,
    "tokensUsed": { "input": 1543, "output": 892, "total": 2435 },
    "modelUsed": "gpt-4o",
    "estimatedCost": 0.0189
  }
}
```

2. **PDF Report:** (Planned feature - uses JSON to generate formatted PDF)

3. **Negotiation Email:** (Planned feature - generates draft with top 3 concerns)

---

## Architecture Overview

### System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Home Page  │→│ File Upload  │→│  Results Page  │  │
│  │  /page.tsx  │  │ PDF/DOCX ext │  │  /contract-    │  │
│  └─────────────┘  └──────────────┘  │   analyzer/    │  │
│         │                            │   page.tsx     │  │
│         │ POST contract text         └────────────────┘  │
│         ↓                                     ↑           │
└─────────┼─────────────────────────────────────┼──────────┘
          │                                     │
          │                                     │ Analysis JSON
          ↓                                     │
┌──────────────────────────────────────────────┼──────────┐
│               SERVER (Next.js API)           │          │
│                                              │          │
│  ┌────────────────────────────────┐          │          │
│  │  POST /api/contract/analyze    │──────────┘          │
│  │  • Validate request (Zod)      │                     │
│  │  • Call OpenAI GPT-4o          │                     │
│  │  • Retry on failures (3x)      │                     │
│  │  • Validate response (Zod)     │                     │
│  │  • Calculate metrics           │                     │
│  └────────┬───────────────────────┘                     │
│           │                                              │
│           │ System prompt + Contract text               │
│           ↓                                              │
│  ┌────────────────────────────────┐                     │
│  │  POST /api/extract-pdf         │                     │
│  │  • Receive PDF file            │                     │
│  │  • Extract text (pdf2json)     │                     │
│  │  • Return plain text           │                     │
│  └────────────────────────────────┘                     │
└──────────┼───────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────────────────┐
│                  OpenAI API (GPT-4o)                      │
│                                                           │
│  • Receives system prompt (expertise definition)          │
│  • Receives user prompt (contract + instructions)         │
│  • Generates structured JSON (enforced by schema)         │
│  • Returns: clauses, risk_score, evidence, suggestions    │
│  • Token usage: ~1,500 input + ~900 output = $0.02       │
└──────────────────────────────────────────────────────────┘
```

### Component Breakdown

**Frontend (`/app`):**
- `page.tsx` - Home page with contract input
- `(chat)/contract-analyzer/page.tsx` - Analysis results dashboard
- `api/contract/analyze/route.ts` - Main analysis API endpoint
- `api/extract-pdf/route.ts` - PDF text extraction endpoint

**Libraries (`/lib`):**
- `contract-analyzer/schemas.ts` - Zod validation schemas
- `contract-analyzer/guardrails.ts` - Input safety checks
- `ai/prompts.ts` - System prompts for AI
- `db/schema.ts` - Database models (for auth/history)

**Components (`/components`):**
- `contract-analyzer/` - Category cards, metrics, diff view
- `ui/` - shadcn/ui primitives (button, card, dialog, etc.)

---

## Tech Stack Deep Dive

### Frontend Layer

**Next.js 15.0.3-canary.2**
- App Router architecture
- Turbopack for faster dev builds
- Server Components for initial page load
- Client Components for interactive UI

**React 19 RC**
- Concurrent rendering
- Automatic batching
- Server Actions (used for auth)

**TypeScript 5.0**
- Strict mode enabled
- Path aliases: `@/` → project root
- Type inference for API responses

**Tailwind CSS**
- Utility-first styling
- Custom config for brand colors
- Responsive design utilities

**shadcn/ui**
- Radix UI primitives underneath
- Accessible components (ARIA compliant)
- Copy-paste philosophy (no npm package bloat)

---

### Backend Layer

**Next.js API Routes**
- RESTful endpoints as serverless functions
- Hot reload in development
- Edge runtime compatible (optional)

**Node.js 18+**
- Native fetch API
- ES Modules support
- Async/await throughout

**File Processing:**
- `pdf2json` - Pure Node.js PDF parser (no canvas dependencies)
- `mammoth` - DOCX to text converter (browser-compatible)

---

### AI Layer

**OpenAI SDK (`@ai-sdk/openai`)**
```typescript
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

const response = await generateObject({
  model: openai('gpt-4o'),
  schema: ContractAnalysisSchema,
  system: systemPrompt,
  prompt: userPrompt,
  temperature: 0.5,
});
```

**Model:** GPT-4o (multimodal, 128K context)
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens
- Average cost per analysis: $0.02-0.05

**Alternative Models:**
- `gpt-4o-mini` - Faster, cheaper ($0.15/$0.60 per 1M tokens)
- `gpt-4-turbo` - Older, more expensive

---

### Validation Layer

**Zod 3.x**
```typescript
export const ClauseSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['arbitration','liability','termination', ...]),
  risk: z.enum(['low','medium','high']),
  who_benefits: z.enum(['company','user','employee','neutral']),
  why_risky: z.string().min(5),
  evidence_quotes: z.array(EvidenceQuoteSchema).min(1),
  pushback: z.string().min(5),
  suggested_revision: z.string().min(5),
  severity_reasoning: z.string().min(5),
});
```

**Why Zod:**
- Runtime validation (catches AI mistakes)
- Type inference (TypeScript types derived automatically)
- Detailed error messages for debugging
- Schema coercion (handles type mismatches gracefully)

---

### Data Layer

**PostgreSQL (via Drizzle ORM)**
- User accounts
- Analysis history (optional feature)
- Saved reports

**Schema Example:**
```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const analyses = pgTable('analyses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  contractType: varchar('contract_type', { length: 50 }),
  riskScore: integer('risk_score'),
  analysisData: json('analysis_data'), // Full JSON blob
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Note:** Current version stores nothing - fully stateless for privacy.

---

### Authentication Layer

**NextAuth 5.0 (Beta)**
- OAuth providers: GitHub, Google (configurable)
- JWT sessions (stateless)
- Edge-compatible
- Middleware for protected routes

**Auth Flow:**
```typescript
// middleware.ts
export { auth as middleware } from "@/app/(auth)/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/api/analyze"],
};
```

---

## Data Flow (Request → Response)

### Analyze Contract Request

**1. Client Request**

```http
POST /api/contract/analyze HTTP/1.1
Content-Type: application/json

{
  "contractText": "EMPLOYMENT OFFER LETTER\nThis Employment Offer Letter...",
  "contractType": "employment_offer",
  "jurisdiction": "us_general",
  "persona": "employee",
  "modelId": "gpt-4o"
}
```

**2. Server Validation**

```typescript
const parsed = AnalyzeRequestSchema.safeParse(json);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Invalid request', details: parsed.error.errors },
    { status: 400 }
  );
}
```

**3. OpenAI API Call**

```typescript
const response = await generateObject({
  model: openai(modelId),
  schema: ContractAnalysisSchema,
  system: productIntelligencePrompt,
  prompt: `Perform comprehensive legal analysis of this ${contractType} 
           contract from the perspective of a ${persona} under ${jurisdiction}...
           
           CONTRACT TEXT:
           ${contractText}
           
           REQUIREMENTS:
           - For EACH clause, provide evidence_quotes with exact text
           - Quote minimum 15 words from contract
           - Specify precise location (Section X, Paragraph Y)...`,
  temperature: 0.5,
});
```

**4. Response Validation**

```typescript
const analysis: ContractAnalysis = response.object;

// Zod validates against schema:
// - overall.risk_score: number 0-100
// - clauses: array, min 1 item
// - each clause has evidence_quotes: array, min 1 item
// - each evidence_quote has quote (min 15 chars) + location (min 2 chars)
```

**5. Metrics Calculation**

```typescript
const tokensUsed = {
  input: response.usage?.promptTokens || 0,
  output: response.usage?.completionTokens || 0,
  total: response.usage?.totalTokens || 0,
};

const estimatedCost = 
  ((tokensUsed.input / 1_000_000) * 2.50) + 
  ((tokensUsed.output / 1_000_000) * 10.00);

const processingTime = Date.now() - start;
```

**6. Server Response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "analysis": {
    "overall": {
      "risk_score": 72,
      "risk_level": "medium",
      "confidence": 0.89,
      "contract_type": "employment_offer",
      "jurisdiction": "us_general",
      "persona": "employee"
    },
    "clauses": [
      {
        "id": "1",
        "category": "non_compete",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "The 12-month non-compete restricts your ability to work in your field after leaving the company, which may be unenforceable in California but could limit job opportunities in other states.",
        "evidence_quotes": [
          {
            "quote": "Employee agrees not to engage in competing business activities or solicit Company clients or employees for twelve (12) months following termination, to the extent permitted by law.",
            "location": "Section 7, Non-Compete and Non-Solicitation"
          }
        ],
        "pushback": "Request to reduce the non-compete period to 6 months and limit it to direct competitors only. Ask for garden leave pay during the restriction period.",
        "suggested_revision": "Employee agrees not to directly solicit Company's clients for a period of six (6) months following termination. Company will provide 50% salary continuation during this period.",
        "severity_reasoning": "Non-competes can be difficult to enforce but may still discourage you from taking jobs or starting companies. Even if ultimately unenforceable, legal challenges cost time and money."
      }
    ],
    "missing_or_weak_clauses": [
      {
        "category": "Severance Terms",
        "why_it_matters": "No severance is specified for termination without cause, leaving you vulnerable to sudden job loss without financial protection.",
        "recommended_language": "In the event of termination without cause, Company shall provide Employee with [X] months of base salary as severance, continued health insurance for [Y] months, and immediate vesting of [Z]% of unvested equity."
      }
    ],
    "recommendations": [
      "Negotiate the non-compete period down to 6 months maximum",
      "Request written clarification on intellectual property created outside of work hours",
      "Ask for severance terms to be explicitly stated in the offer",
      "Consider having the contract reviewed by an employment attorney in your state"
    ]
  },
  "processingTime": 8234,
  "tokensUsed": {
    "input": 1543,
    "output": 892,
    "total": 2435
  },
  "modelUsed": "gpt-4o",
  "estimatedCost": 0.018915,
  "retryCount": 0
}
```

---

## Prompting Approach

### System Prompt Architecture

The system prompt defines the AI's expertise, behavior, and constraints. Located in `/lib/ai/prompts.ts`:

```typescript
export const productIntelligencePrompt = `
You are an AI-powered Contract Risk Analyzer.

IMPORTANT CONTEXT
-----------------
This application is a decision-support and analysis tool.
It does NOT provide legal advice.
Your role is to help users UNDERSTAND contracts, not replace a lawyer.

PRIMARY OBJECTIVE
-----------------
Transform unstructured contract text into structured, explainable, 
and actionable risk insights.

ANALYSIS PRINCIPLES
-------------------
1. Evidence-based reasoning  
   - Never invent clauses
   - Every risk must cite actual text from the contract

2. Plain-English explanations  
   - Avoid legal jargon where possible
   - Explain risks like you are speaking to a smart non-lawyer

3. Conservative interpretation  
   - If something is unclear, say so
   - If information is missing, flag it instead of guessing

4. Balanced perspective  
   - Clearly state who benefits from each clause

5. Explainability  
   - Every flagged risk must include:
     • what the clause does  
     • why it could be risky  
     • when it might matter in real life

...
`;
```

**Key Design Decisions:**

1. **Role Definition** - "AI-powered Contract Risk Analyzer" (not "lawyer" or "legal advisor")
2. **Disclaimer Upfront** - "Does NOT provide legal advice" stated immediately
3. **Conservative Approach** - "If unclear, say so" prevents hallucination
4. **Evidence Requirement** - "Every risk must cite actual text" enforces grounding
5. **Plain Language Mandate** - "Explain like speaking to a smart non-lawyer"

---

### User Prompt Construction

The user prompt combines contract text with analysis instructions:

```typescript
const baseUserPrompt = `
Perform a comprehensive legal analysis of this ${contractType} contract 
from the perspective of a ${persona} under ${jurisdiction} jurisdiction.

CONTRACT TEXT:
${contractText}

ANALYSIS REQUIREMENTS:
- Identify ALL risky, unfair, or unusual clauses
- For EACH clause, provide evidence_quotes with:
  * quote: Copy the EXACT text word-for-word (minimum 15 words)
  * location: Specify exactly where it appears (e.g., "Section 7")
- Explain each risk in plain English
- Assess who benefits from each clause
- Provide specific negotiation language
- Suggest concrete revisions
- Identify missing protections
- Calculate overall risk score (0-100)

CRITICAL: Do NOT invent or paraphrase quotes. Copy the actual text.
`;
```

**Prompt Engineering Techniques:**

1. **Specificity** - "minimum 15 words" prevents vague quotes
2. **Examples** - "e.g., 'Section 7'" shows expected format
3. **Emphasis** - "CRITICAL: Do NOT invent..." in caps for importance
4. **Structure** - Bullet points for easy parsing by AI
5. **Persona Context** - "from perspective of ${persona}" tailors analysis

---

### Schema Enforcement

OpenAI's Structured Outputs feature enforces JSON schema:

```typescript
const response = await generateObject({
  model: openai('gpt-4o'),
  schema: ContractAnalysisSchema, // Zod schema
  system: systemPrompt,
  prompt: userPrompt,
  temperature: 0.5,
});

// Response is GUARANTEED to match schema or error is thrown
const analysis: ContractAnalysis = response.object;
```

**Benefits:**
- No parsing errors
- No JSON formatting mistakes
- Consistent structure every time
- Retry on schema mismatch (automatic with AI SDK)

---

### Retry Strategy

```typescript
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

let retries = 0;
while (retries <= MAX_RETRIES) {
  try {
    const response = await generateObject({
      model: openai(modelId),
      schema: ContractAnalysisSchema,
      system: systemPrompt,
      prompt: baseUserPrompt + (retries > 0 ? 
        "\n\nIMPORTANT: Extract verbatim quotes. Every clause MUST include evidence_quotes." 
        : ''
      ),
      temperature: 0.5,
    });
    result = response;
    break;
  } catch (err: any) {
    // Rate limit detection
    if (err.message && err.message.includes('Rate limit')) {
      break; // Stop retrying on rate limits
    }
    
    retries++;
    if (retries > MAX_RETRIES) break;
    await delay(RETRY_DELAY_MS * retries); // Exponential backoff
  }
}
```

**Retry Logic:**
- Try up to 3 times (1 initial + 2 retries)
- Add stronger instructions on retry ("MUST include evidence_quotes")
- Exponential backoff: 1s, 2s delay
- Early exit on rate limits (don't waste retries)

---

## Validation Strategy

### Input Validation (Request)

```typescript
export const AnalyzeRequestSchema = z.object({
  contractText: z.string().min(50), // At least 50 chars
  contractType: z.enum([
    'tos', 'nda', 'employment_offer', 
    'saas_agreement', 'lease', 'other'
  ]),
  jurisdiction: z.enum(['us_general', 'ca', 'ny', 'other']),
  persona: z.enum(['founder', 'company', 'user', 'employee']),
  modelId: z.string().default('gpt-4o'),
});

// Usage
const parsed = AnalyzeRequestSchema.safeParse(requestBody);
if (!parsed.success) {
  return NextResponse.json({
    error: 'Invalid request',
    details: parsed.error.errors // Detailed field-level errors
  }, { status: 400 });
}
```

**Validates:**
- `contractText` exists and has minimum length
- `contractType` is one of valid enums
- `jurisdiction` matches expected values
- `persona` is valid
- `modelId` defaults to 'gpt-4o' if not provided

---

### Output Validation (Response)

```typescript
export const ContractAnalysisSchema = z.object({
  overall: z.object({
    risk_score: z.number().min(0).max(100),
    risk_level: z.enum(['low','medium','high']),
    confidence: z.number().min(0).max(1),
    contract_type: z.enum(['tos','nda','employment_offer',...]),
    jurisdiction: z.enum(['us_general','ca','ny','other']),
    persona: z.enum(['founder','company','user','employee']),
  }),
  clauses: z.array(z.object({
    id: z.string().min(1),
    category: z.enum(['arbitration','liability','termination',...]),
    risk: z.enum(['low','medium','high']),
    who_benefits: z.enum(['company','user','employee','neutral']),
    why_risky: z.string().min(5),
    evidence_quotes: z.array(z.object({
      quote: z.string().min(5),
      location: z.string().min(2),
    })).min(1), // At least 1 evidence quote required
    pushback: z.string().min(5),
    suggested_revision: z.string().min(5),
    severity_reasoning: z.string().min(5),
  })).min(1), // At least 1 clause required
  missing_or_weak_clauses: z.array(z.object({
    category: z.string().min(2),
    why_it_matters: z.string().min(5),
    recommended_language: z.string().min(5),
  })).default([]),
  recommendations: z.array(z.string()).default([]),
});
```

**Key Validations:**
- `risk_score` between 0-100
- `confidence` between 0-1 (percentage)
- `clauses` array must have at least 1 item
- Each clause must have at least 1 `evidence_quote`
- Each `evidence_quote` must have `quote` (min 5 chars) + `location` (min 2 chars)
- Strings have minimum lengths to prevent empty responses

**"Retry Until Valid" Strategy:**

The AI SDK automatically retries if response doesn't match schema:

```typescript
// This is handled internally by generateObject()
// If AI returns invalid JSON, it retries with error message
// "Your previous response didn't match the schema. Please fix: ..."
```

**Manual Retry Logic:**

```typescript
let retries = 0;
while (retries <= MAX_RETRIES) {
  try {
    const response = await generateObject({
      model: openai(modelId),
      schema: ContractAnalysisSchema,
      // ...
    });
    
    // If we get here, schema is valid
    const analysis = response.object;
    break;
    
  } catch (err: any) {
    if (err.name === 'AI_TypeValidationError') {
      console.error('Schema validation failed:', err.cause);
      // Retry with stronger instructions
    }
    retries++;
  }
}
```

---

## Observability

### Token Tracking

```typescript
const tokensUsed = {
  input: response.usage?.promptTokens || 0,
  output: response.usage?.completionTokens || 0,
  total: response.usage?.totalTokens || 0,
};
```

**Typical Token Counts:**
- Short contract (~500 words): 800 input + 500 output = 1,300 total
- Medium contract (~1,500 words): 2,000 input + 900 output = 2,900 total
- Long contract (~5,000 words): 6,500 input + 1,200 output = 7,700 total

---

### Latency Tracking

```typescript
const start = Date.now();

// ... OpenAI API call ...

const processingTime = Date.now() - start;
```

**Typical Latencies:**
- GPT-4o: 5-15 seconds (depends on output length)
- GPT-4o-mini: 2-8 seconds (faster, less accurate)

---

### Cost Calculation

```typescript
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 }, // per 1M tokens
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
  return ((inputTokens / 1_000_000) * pricing.input) + 
         ((outputTokens / 1_000_000) * pricing.output);
}
```

**Typical Costs:**
- GPT-4o: $0.01 - $0.05 per analysis
- GPT-4o-mini: $0.001 - $0.003 per analysis

---

### Error Tracking

**Console Logging:**

```typescript
console.log('[API] Received request:', JSON.stringify(json).slice(0, 200));
console.log('[API] Validation passed, analyzing...');
console.log(`[API] Attempt ${retries + 1}/${MAX_RETRIES + 1}`);
console.error('[API] OpenAI error:', err.message);
console.log('[API] OpenAI call successful');
```

**Error Types Logged:**

1. **Validation Errors** - Request doesn't match `AnalyzeRequestSchema`
2. **OpenAI API Errors** - Rate limits, network issues, timeouts
3. **Schema Validation Errors** - AI response doesn't match `ContractAnalysisSchema`
4. **Retry Exhaustion** - All retry attempts failed

**Error Response Format:**

```json
{
  "error": "OpenAI rate limit reached",
  "details": "You exceeded your current quota...",
  "isRateLimit": true,
  "retryCount": 0
}
```

---

### Metrics Dashboard (Planned)

Future observability features:
- Average latency over time
- Token consumption trends
- Cost per contract type
- Success/failure rates
- Most common error types
- Schema validation failure analysis

---

## Security Considerations

### 1. API Key Security

**Best Practices:**
```bash
# .env.local (NEVER commit to git)
OPENAI_API_KEY=sk-proj-xxxxx

# .gitignore
.env.local
.env*.local
```

**Environment Variable Access:**
```typescript
// Server-side only (API routes)
const apiKey = process.env.OPENAI_API_KEY;

// NEVER expose in client code:
// ❌ const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
```

**Vercel Deployment:**
- Add environment variables in Vercel dashboard
- Use "Secret" type for sensitive values
- Regenerate keys periodically

---

### 2. PII/PHI Handling

**⚠️ WARNING:** This tool is NOT HIPAA compliant or GDPR-ready by default.

**Current State:**
- No data persistence (contracts processed in-memory only)
- No logging of contract content
- No third-party analytics on contract text

**User Responsibility:**
- Do not upload contracts with Protected Health Information (PHI)
- Do not upload contracts with sensitive Personal Identifiable Information (PII)
- Redact social security numbers, credit cards, medical info before upload

**Future Enhancements:**
- Client-side redaction (detect and mask SSN, emails, phone numbers before sending to API)
- Server-side PII detection (Presidio library)
- End-to-end encryption for stored analyses

---

### 3. Rate Limiting

**OpenAI Rate Limits:**
- Free tier: 3 requests per minute (RPM)
- Paid tier: 5,000 RPM+

**Detection & Handling:**
```typescript
if (err.message && err.message.includes('Rate limit')) {
  console.error('[API] Rate limit detected, stopping retries');
  return NextResponse.json({
    error: 'OpenAI rate limit reached',
    details: 'Please wait a moment and try again',
    isRateLimit: true,
  }, { status: 429 });
}
```

**Application-Level Rate Limiting (Future):**
```typescript
// Using Upstash Redis + @upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
});

const { success } = await ratelimit.limit(userId);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

### 4. Input Sanitization

**SQL Injection:** N/A (no user-controlled SQL queries)

**XSS Prevention:**
- React auto-escapes JSX content
- No `dangerouslySetInnerHTML` used
- Contract text displayed as plain text, not HTML

**File Upload Security:**
```typescript
// File type validation
const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// File size limit
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large');
}
```

---

### 5. CORS & CSRF

**CORS:** Not needed (same-origin API calls)

**CSRF Protection:**
- NextAuth handles CSRF tokens for authenticated routes
- API routes use SameSite cookies

---

## Limitations & Known Issues

### Current Limitations

1. **No Legal Authority** - Output is educational only, not legal advice
2. **AI Hallucination Risk** - May occasionally misinterpret clause intent
3. **Language Support** - English only (no Spanish, French, etc.)
4. **Contract Length** - Max ~20,000 words (GPT-4o context limit)
5. **No Historical Tracking** - No saved analyses (stateless by design)
6. **Single Document** - Cannot compare multiple contract versions
7. **No Collaboration** - Cannot share analyses with team members
8. **PDF Limitations** - Image-based PDFs (scanned documents) not supported
9. **Jurisdiction Limits** - US law focus (not international)
10. **Market Data** - "Standard vs Aggressive" is AI opinion, not backed by clause database

---

### Known Issues

1. **Rate Limiting** - Free OpenAI tier (3 RPM) insufficient for production
2. **Schema Mismatches** - Occasionally AI returns invalid `category` enum (e.g., "benefits" instead of "other")
3. **Evidence Quality** - Sometimes quotes are too long or imprecise
4. **Confidence Scores** - Not calibrated (AI's confidence may be overestimated)
5. **Mobile UX** - Dashboard not optimized for small screens
6. **PDF Extraction** - Complex PDFs with tables/multi-column layouts may extract incorrectly

---

### Future Improvements

**High Priority:**
1. ✅ Fix schema validation errors (add more enum values or use "other" fallback)
2. ✅ Improve PDF extraction quality (try alternative libraries like Unstructured.io)
3. ⬜ Add version comparison (diff between contract v1 and v2)
4. ⬜ Implement user accounts + analysis history

**Medium Priority:**
5. ⬜ Multi-language support (Spanish, French, German)
6. ⬜ Clause library (database of standard clauses by jurisdiction)
7. ⬜ Export to Word/PDF with formatting
8. ⬜ Email negotiation template generator

**Low Priority:**
9. ⬜ Team collaboration (share analyses)
10. ⬜ Integrations (DocuSign, Salesforce webhooks)
11. ⬜ Custom prompts by industry vertical
12. ⬜ Historical analytics (track negotiation success)

---

## Performance Benchmarks

### Analysis Speed

| Contract Type | Length | Model | Avg Time | Token Count | Cost |
|--------------|--------|-------|----------|-------------|------|
| Employment Offer | 800 words | GPT-4o | 7.2s | 1,200 | $0.015 |
| SaaS TOS | 2,000 words | GPT-4o | 12.4s | 3,100 | $0.035 |
| NDA (Mutual) | 600 words | GPT-4o | 5.8s | 950 | $0.012 |
| Commercial Lease | 3,500 words | GPT-4o | 18.9s | 5,400 | $0.062 |

**Notes:**
- Times measured on Vercel serverless (cold start excluded)
- Token counts include system prompt (~500 tokens)
- Costs calculated at Jan 2026 pricing

---

### File Processing Speed

| File Type | Size | Extraction Time | Method |
|-----------|------|-----------------|--------|
| PDF | 2 pages | 0.3s | pdf2json (server-side) |
| DOCX | 5 pages | 0.1s | mammoth (client-side) |
| TXT | 50KB | 0.01s | native read |

---

## Deployment Guide

### Vercel (Recommended)

**Prerequisites:**
- GitHub account
- Vercel account (free tier works)
- OpenAI API key

**Steps:**

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/coco.git
git push -u origin main
```

2. **Import to Vercel:**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import from GitHub
- Select repository

3. **Add Environment Variables:**
```
OPENAI_API_KEY=sk-proj-xxxxx
DATABASE_URL=postgresql://... (optional)
AUTH_SECRET=your-random-secret (optional)
```

4. **Deploy:**
- Click "Deploy"
- Wait 2-3 minutes
- Access at `https://your-project.vercel.app`

**Custom Domain:**
- Go to Project Settings → Domains
- Add custom domain
- Update DNS records

---

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Build & Run:**
```bash
docker build -t coco-analyzer .
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx \
  coco-analyzer
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/api/analyze.test.ts
import { POST } from '@/app/api/contract/analyze/route';

describe('POST /api/contract/analyze', () => {
  it('returns 400 for invalid request', async () => {
    const request = new Request('http://localhost/api/contract/analyze', {
      method: 'POST',
      body: JSON.stringify({ contractText: 'too short' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
  
  it('returns analysis for valid contract', async () => {
    const request = new Request('http://localhost/api/contract/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contractText: 'EMPLOYMENT OFFER LETTER\n...',
        contractType: 'employment_offer',
        jurisdiction: 'us_general',
        persona: 'employee',
        modelId: 'gpt-4o',
      }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.analysis).toBeDefined();
    expect(data.analysis.overall.risk_score).toBeGreaterThanOrEqual(0);
    expect(data.analysis.overall.risk_score).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests

```typescript
// e2e/analyze-flow.spec.ts
import { test, expect } from '@playwright/test';

test('analyze contract end-to-end', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Select contract type
  await page.click('text=Employment Offer');
  
  // Paste contract text
  await page.fill('textarea', 'EMPLOYMENT OFFER LETTER\n...');
  
  // Click analyze
  await page.click('text=Analyze');
  
  // Wait for results
  await page.waitForSelector('text=Analysis Dashboard', { timeout: 30000 });
  
  // Verify results displayed
  const riskScore = await page.textContent('[data-testid="risk-score"]');
  expect(parseInt(riskScore)).toBeGreaterThan(0);
});
```

---

## Conclusion

**Coco** demonstrates how modern AI can democratize access to legal understanding. By combining GPT-4o's natural language capabilities with structured validation, thoughtful prompting, and clean UX design, we've built a tool that makes contract analysis accessible to anyone.

**Key Takeaways:**

1. **Structured Outputs** - Zod schemas + OpenAI's schema enforcement = consistent, parseable responses
2. **Prompt Engineering** - Clear role definition + evidence requirements + plain language mandate = quality analysis
3. **User-Centric Design** - No legal jargon, expandable categories, exact quotes = comprehensible insights
4. **Production Ready** - Retry logic, rate limit handling, cost tracking, error logging = reliable system

**Next Steps:**

- Add historical tracking (user accounts + saved analyses)
- Build clause library (database of standard terms by jurisdiction)
- Implement version comparison (track changes between drafts)
- Expand to multi-language support

**Contact:** For questions or feedback, reach out at [your-email@example.com](mailto:your-email@example.com)

---

**End of Technical Report**
