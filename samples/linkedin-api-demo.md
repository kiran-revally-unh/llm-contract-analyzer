# Coco Contract Companion - OpenAI API Sample

> Simple example showing secure server-side OpenAI integration for contract analysis

## Architecture Overview

```
Frontend (React) → Next.js API Route → OpenAI API → Structured Response
                    [API Key Here]
```

---

## 1️⃣ Frontend: User sends intent

```typescript
// User uploads contract and selects preferences
const response = await fetch('/api/contract/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractText: "This Employment Agreement...",
    contractType: "employment",
    jurisdiction: "California",
    persona: "employee",
    modelId: "gpt-4o-mini"
  })
});

const result = await response.json();
```

**Key Point**: No API keys in frontend! Just business intent.

---

## 2️⃣ Backend: Secure API processing

```typescript
// app/api/contract/analyze/route.ts
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

export async function POST(request: Request) {
  const { contractText, contractType, persona } = await request.json();
  
  // OpenAI API key from environment (server-side only)
  const analysis = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ContractAnalysisSchema,
    system: "You are a legal analysis assistant...",
    prompt: `Analyze this ${contractType} from ${persona} perspective:\n${contractText}`
  });
  
  return NextResponse.json({
    clauses: analysis.object.clauses,
    riskScore: analysis.object.riskScore,
    recommendations: analysis.object.recommendations
  });
}
```

**Key Point**: API key lives in `.env` server-side. Never exposed to client.

---

## 3️⃣ Response: Clean structured output

```json
{
  "clauses": [
    {
      "title": "Non-Compete Clause",
      "risk_level": "high",
      "who_benefits": "employer",
      "evidence_quotes": [{
        "quote": "Employee shall not engage in any competing business for 24 months...",
        "location": "Section 7.2"
      }],
      "plain_english": "You can't work for competitors for 2 years after leaving",
      "suggested_revision": "Reduce to 6 months and limit to direct competitors only"
    }
  ],
  "riskScore": 72,
  "recommendations": [
    "Negotiate shorter non-compete duration",
    "Request severance protection"
  ]
}
```

**Key Point**: Structured, validated output using Zod schemas. No hallucinated data.

---

## Security & Best Practices

✅ **API Key Security**: Server-side only, never in frontend code  
✅ **Input Validation**: Zod schemas validate all requests  
✅ **Error Handling**: Retry logic with exponential backoff  
✅ **Cost Tracking**: Token usage and pricing calculated per request  
✅ **Type Safety**: Full TypeScript with validated schemas  

---

## Tech Stack

- **Next.js 15** - API routes for backend
- **Vercel AI SDK** - OpenAI integration
- **Zod** - Runtime validation
- **OpenAI GPT-4o-mini** - LLM for analysis

---

## Try it Live

🔗 https://main.d2f04gah5juytg.amplifyapp.com

Built with security and transparency at the core. All AI processing happens server-side with proper validation and error handling.
