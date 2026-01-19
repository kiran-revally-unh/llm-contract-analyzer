# API Documentation

Complete reference for all API endpoints in the Coco Contract Analyzer.

---

## Table of Contents

- [POST /api/contract/analyze](#post-apicontractanalyze)
- [POST /api/extract-pdf](#post-apiextract-pdf)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Authentication](#authentication)

---

## POST /api/contract/analyze

Analyzes a contract using AI to identify risky clauses, calculate risk scores, and provide negotiation strategies.

### Endpoint

```
POST /api/contract/analyze
```

### Headers

```http
Content-Type: application/json
```

### Request Body

```typescript
{
  contractText: string;        // The full contract text (min 50 chars)
  contractType: string;        // 'employment_offer' | 'tos' | 'nda' | 'lease' | 'other'
  jurisdiction: string;        // 'us_general' | 'ca' | 'ny' | 'other'
  persona: string;             // 'founder' | 'company' | 'user' | 'employee'
  modelId: string;             // 'gpt-4o' | 'gpt-4o-mini' (default: 'gpt-4o')
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contractText` | string | Yes | Full contract text to analyze. Must be at least 50 characters. |
| `contractType` | enum | Yes | Type of contract being analyzed. Affects analysis focus and recommendations. |
| `jurisdiction` | enum | Yes | Legal jurisdiction for analysis context. |
| `persona` | enum | Yes | Perspective for analysis (who is reading the contract). |
| `modelId` | string | No | AI model to use. Defaults to 'gpt-4o'. |

#### Example Request

```bash
curl -X POST http://localhost:3000/api/contract/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "contractText": "EMPLOYMENT OFFER LETTER\n\nDear Candidate,\n\nWe are pleased to offer you the position of Senior Software Engineer...",
    "contractType": "employment_offer",
    "jurisdiction": "us_general",
    "persona": "employee",
    "modelId": "gpt-4o"
  }'
```

### Response (200 OK)

```typescript
{
  analysis: {
    overall: {
      risk_score: number;              // 0-100
      risk_level: string;              // 'low' | 'medium' | 'high'
      confidence: number;              // 0-1 (e.g., 0.89 = 89% confidence)
      contract_type: string;           // Detected type
      jurisdiction: string;            // Analyzed jurisdiction
      persona: string;                 // Analysis perspective
    };
    clauses: Array<{
      id: string;                      // Unique clause ID
      category: string;                // 'termination' | 'ip' | 'non_compete' | ...
      risk: string;                    // 'low' | 'medium' | 'high'
      who_benefits: string;            // 'company' | 'user' | 'employee' | 'neutral'
      why_risky: string;               // Plain-English explanation
      evidence_quotes: Array<{
        quote: string;                 // Verbatim text from contract
        location: string;              // "Section X, Paragraph Y"
      }>;
      pushback: string;                // How to negotiate this clause
      suggested_revision: string;      // Recommended contract language
      severity_reasoning: string;      // Why this risk level was assigned
    }>;
    missing_or_weak_clauses: Array<{
      category: string;                // What's missing (e.g., "Severance Terms")
      why_it_matters: string;          // Impact of the absence
      recommended_language: string;    // Suggested clause to add
    }>;
    recommendations: string[];         // High-level action items
  };
  processingTime: number;              // Milliseconds
  tokensUsed: {
    input: number;                     // Prompt tokens
    output: number;                    // Completion tokens
    total: number;                     // Sum
  };
  modelUsed: string;                   // 'gpt-4o' | 'gpt-4o-mini'
  estimatedCost: number;               // USD (e.g., 0.0189)
  retryCount: number;                  // Number of retries (0 if successful first try)
}
```

#### Example Response

```json
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
      },
      {
        "id": "2",
        "category": "ip",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "All inventions created during employment belong to the company, even if made outside work hours or using personal resources.",
        "evidence_quotes": [
          {
            "quote": "All inventions, discoveries, and works of authorship conceived or made by Employee during employment shall be the sole property of Company.",
            "location": "Section 5, Intellectual Property"
          }
        ],
        "pushback": "Request an exclusion for inventions created entirely on personal time, using personal resources, and unrelated to company business.",
        "suggested_revision": "Exclude inventions that are: (a) developed entirely on Employee's own time; (b) without using Company equipment, supplies, facilities, or trade secret information; and (c) do not relate to Company's business or actual or demonstrably anticipated research.",
        "severity_reasoning": "Broad IP clauses can prevent you from working on side projects or creating your own products, even if they don't compete with the company."
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

## POST /api/extract-pdf

Extracts plain text from a PDF file (server-side processing using pdf2json).

### Endpoint

```
POST /api/extract-pdf
```

### Headers

```http
Content-Type: multipart/form-data
```

### Request Body

```
Form Data:
  file: <PDF file binary>
```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/extract-pdf \
  -F "file=@/path/to/contract.pdf"
```

### Response (200 OK)

```typescript
{
  text: string;    // Extracted plain text from PDF
}
```

#### Example Response

```json
{
  "text": "EMPLOYMENT OFFER LETTER\n\nDear John Smith,\n\nWe are pleased to offer you the position of Senior Software Engineer at Acme Corp..."
}
```

### Error Responses

#### 400 Bad Request - No File Uploaded

```json
{
  "error": "No file uploaded"
}
```

#### 400 Bad Request - Invalid PDF

```json
{
  "error": "Failed to parse PDF",
  "details": "PDF parsing error: Invalid PDF structure"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Failed to extract text from PDF",
  "details": "Unexpected error during PDF processing"
}
```

---

## Error Handling

All API endpoints follow consistent error response formats.

### Error Response Format

```typescript
{
  error: string;           // Human-readable error message
  details?: string;        // Additional context (optional)
  isRateLimit?: boolean;   // True if OpenAI rate limit hit
  retryCount?: number;     // Number of retry attempts made
}
```

### HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Invalid input (fails Zod validation) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | OpenAI API error, unexpected failure |

### Common Errors

#### 400 - Invalid Request Body

```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "too_small",
      "minimum": 50,
      "path": ["contractText"],
      "message": "String must contain at least 50 character(s)"
    }
  ]
}
```

**Cause:** Request body doesn't match Zod schema  
**Fix:** Ensure all required fields are present and valid

---

#### 429 - Rate Limit Exceeded

```json
{
  "error": "OpenAI rate limit reached",
  "details": "You exceeded your current quota, please check your plan and billing details",
  "isRateLimit": true,
  "retryCount": 0
}
```

**Cause:** Too many requests to OpenAI API  
**Fix:** Wait 60 seconds and retry, or upgrade OpenAI plan

---

#### 500 - OpenAI API Error

```json
{
  "error": "Failed to analyze contract after 3 attempts",
  "details": "OpenAI API error: Connection timeout",
  "retryCount": 2
}
```

**Cause:** OpenAI service unavailable or network issues  
**Fix:** Retry request or check OpenAI status page

---

#### 500 - Schema Validation Error

```json
{
  "error": "AI response validation failed",
  "details": "AI returned invalid JSON schema after 3 retries",
  "retryCount": 2
}
```

**Cause:** AI couldn't generate valid response matching schema  
**Fix:** This is rare; if it happens repeatedly, simplify the contract text or try again

---

## Rate Limiting

### OpenAI Rate Limits

Coco inherits OpenAI's rate limits based on your API key tier:

| Tier | Requests Per Minute (RPM) | Tokens Per Minute (TPM) |
|------|---------------------------|-------------------------|
| Free Trial | 3 RPM | 40,000 TPM |
| Tier 1 | 500 RPM | 200,000 TPM |
| Tier 2 | 5,000 RPM | 2,000,000 TPM |

**Detection:** API returns 429 status with `isRateLimit: true`

**Handling:**
- Frontend shows "Rate limit exceeded, please wait..."
- Backend stops retrying immediately (doesn't waste attempts)
- User must wait ~60 seconds before trying again

### Application-Level Rate Limiting (Future)

Planned implementation using Upstash Redis:

```typescript
// Per-user rate limit: 10 analyses per hour
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

const { success } = await ratelimit.limit(userId);
```

---

## Authentication

**Current State:** No authentication required (open API)

**Future Implementation:** NextAuth 5.0 will protect endpoints

### Protected Endpoints (Planned)

```typescript
// middleware.ts
export { auth as middleware } from "@/app/(auth)/auth";

export const config = {
  matcher: ["/api/contract/analyze", "/api/history"],
};
```

### Authentication Flow (Planned)

1. User signs in via OAuth (GitHub, Google)
2. NextAuth sets encrypted JWT cookie
3. Middleware checks session on protected routes
4. API endpoints access user via `auth()` helper

```typescript
import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated user
  const userId = session.user.id;
}
```

---

## Request Examples

### JavaScript (Fetch)

```javascript
async function analyzeContract(contractText) {
  const response = await fetch('/api/contract/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contractText,
      contractType: 'employment_offer',
      jurisdiction: 'us_general',
      persona: 'employee',
      modelId: 'gpt-4o',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}
```

---

### Python (requests)

```python
import requests

def analyze_contract(contract_text):
    url = 'http://localhost:3000/api/contract/analyze'
    payload = {
        'contractText': contract_text,
        'contractType': 'employment_offer',
        'jurisdiction': 'us_general',
        'persona': 'employee',
        'modelId': 'gpt-4o'
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()
```

---

### cURL

```bash
# Analyze contract
curl -X POST http://localhost:3000/api/contract/analyze \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "contractText": "EMPLOYMENT OFFER LETTER...",
  "contractType": "employment_offer",
  "jurisdiction": "us_general",
  "persona": "employee",
  "modelId": "gpt-4o"
}
EOF

# Extract PDF
curl -X POST http://localhost:3000/api/extract-pdf \
  -F "file=@contract.pdf"
```

---

## Webhooks (Planned)

Future feature for integration with document signing platforms.

### POST /api/webhooks/docusign

Receives signed document events from DocuSign.

### POST /api/webhooks/contractworks

Receives contract upload events from ContractWorks.

---

## SDK (Planned)

Future feature: Official TypeScript/JavaScript SDK

```typescript
import { CocoClient } from '@coco/sdk';

const client = new CocoClient({
  apiKey: process.env.COCO_API_KEY,
});

const analysis = await client.analyzeContract({
  text: contractText,
  type: 'employment_offer',
});

console.log(analysis.riskScore);
```

---

## Changelog

### v1.0 (January 2026)
- Initial API release
- POST /api/contract/analyze endpoint
- POST /api/extract-pdf endpoint
- Zod schema validation
- GPT-4o integration
- Retry logic with exponential backoff

---

## Support

For API issues or questions:
- **GitHub Issues:** [github.com/yourusername/coco/issues](https://github.com/yourusername/coco/issues)
- **Email:** your-email@example.com
- **Documentation:** [docs.coco.dev](https://docs.coco.dev)

---

**End of API Documentation**
