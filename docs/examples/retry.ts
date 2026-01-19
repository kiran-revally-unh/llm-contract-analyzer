# Example Retry Logic

This document shows the retry strategy used in Coco's API for handling transient failures.

---

## Retry Configuration

```typescript
const MAX_RETRIES = 2;                    // Retry up to 2 times (3 total attempts)
const RETRY_DELAY_MS = 1000;              // Base delay: 1 second
const EXPONENTIAL_BACKOFF = true;         // Double delay on each retry
```

---

## Full Retry Implementation

**Location:** `/app/api/contract/analyze/route.ts`

```typescript
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { ContractAnalysisSchema, AnalyzeRequestSchema } from '@/lib/contract-analyzer/schemas';
import { productIntelligencePrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  const start = Date.now();
  
  // Parse and validate request
  const json = await request.json();
  const parsed = AnalyzeRequestSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid request',
      details: parsed.error.errors
    }, { status: 400 });
  }
  
  const { contractText, contractType, jurisdiction, persona, modelId } = parsed.data;
  
  // Retry configuration
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 1000;
  let retries = 0;
  let result: any = null;
  
  // Base user prompt
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
  `.trim();
  
  // Retry loop
  while (retries <= MAX_RETRIES) {
    try {
      console.log(`[API] Attempt ${retries + 1}/${MAX_RETRIES + 1}`);
      
      // Enhanced prompt on retry
      const userPrompt = retries > 0
        ? baseUserPrompt + `

IMPORTANT: Your previous response did not validate correctly.
Make sure EVERY clause includes the evidence_quotes array with at least one quote.
Extract verbatim quotes from the contract text provided above.
        `
        : baseUserPrompt;
      
      // Call OpenAI with structured output
      const response = await generateObject({
        model: openai(modelId),
        schema: ContractAnalysisSchema,
        system: productIntelligencePrompt,
        prompt: userPrompt,
        temperature: 0.5,
      });
      
      console.log('[API] OpenAI call successful');
      result = response;
      break; // Success - exit retry loop
      
    } catch (err: any) {
      console.error(`[API] Error on attempt ${retries + 1}:`, err.message);
      
      // Check for rate limit errors
      if (err.message && err.message.includes('Rate limit')) {
        console.error('[API] Rate limit detected, stopping retries');
        return NextResponse.json({
          error: 'OpenAI rate limit reached',
          details: err.message,
          isRateLimit: true,
          retryCount: retries,
        }, { status: 429 });
      }
      
      // Increment retry counter
      retries++;
      
      // If max retries exceeded, return error
      if (retries > MAX_RETRIES) {
        console.error('[API] Max retries exceeded');
        return NextResponse.json({
          error: 'Failed to analyze contract after 3 attempts',
          details: err.message,
          retryCount: retries - 1,
        }, { status: 500 });
      }
      
      // Exponential backoff delay
      const delay = RETRY_DELAY_MS * retries; // 1s, 2s, 3s
      console.log(`[API] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If no result after all retries, return error
  if (!result) {
    return NextResponse.json({
      error: 'Failed to analyze contract',
      retryCount: retries,
    }, { status: 500 });
  }
  
  // Calculate metrics
  const processingTime = Date.now() - start;
  const tokensUsed = {
    input: result.usage?.promptTokens || 0,
    output: result.usage?.completionTokens || 0,
    total: result.usage?.totalTokens || 0,
  };
  
  const estimatedCost = 
    ((tokensUsed.input / 1_000_000) * 2.50) + 
    ((tokensUsed.output / 1_000_000) * 10.00);
  
  // Return success response
  return NextResponse.json({
    analysis: result.object,
    processingTime,
    tokensUsed,
    modelUsed: modelId,
    estimatedCost,
    retryCount: retries,
  });
}
```

---

## Retry Strategy Breakdown

### 1. Retry Counter

```typescript
let retries = 0;
const MAX_RETRIES = 2;

while (retries <= MAX_RETRIES) {
  // Try operation
  
  if (success) break;  // Exit loop on success
  
  retries++;  // Increment counter
  
  if (retries > MAX_RETRIES) {
    // Give up
    return error;
  }
}
```

**Result:** 3 total attempts (initial + 2 retries)

---

### 2. Exponential Backoff

```typescript
const RETRY_DELAY_MS = 1000; // 1 second base

// Attempt 1: No delay (immediate)
// Attempt 2: 1000ms delay (1 second)
// Attempt 3: 2000ms delay (2 seconds)

const delay = RETRY_DELAY_MS * retries;
await new Promise(resolve => setTimeout(resolve, delay));
```

**Benefits:**
- Gives transient issues time to resolve
- Prevents overwhelming the API with rapid retries
- Reduces likelihood of hitting rate limits

---

### 3. Enhanced Prompts on Retry

```typescript
const userPrompt = retries > 0
  ? baseUserPrompt + `

IMPORTANT: Your previous response did not validate correctly.
Make sure EVERY clause includes the evidence_quotes array with at least one quote.
Extract verbatim quotes from the contract text provided above.
  `
  : baseUserPrompt;
```

**Why This Works:**
- First attempt uses standard prompt
- Subsequent attempts add explicit reminders about validation failures
- Tells AI exactly what was missing (e.g., "evidence_quotes array")
- Different prompts increase chance of success vs. repeating same request

---

### 4. Rate Limit Detection

```typescript
if (err.message && err.message.includes('Rate limit')) {
  console.error('[API] Rate limit detected, stopping retries');
  return NextResponse.json({
    error: 'OpenAI rate limit reached',
    details: err.message,
    isRateLimit: true,
    retryCount: retries,
  }, { status: 429 });
}
```

**Why Stop on Rate Limits:**
- Retrying won't help (still rate limited)
- Preserves remaining retry attempts for real transient errors
- Returns 429 status (standard HTTP rate limit code)
- Client can implement exponential backoff at higher level

---

### 5. Schema Validation Retry

OpenAI's `generateObject()` has built-in retry for schema validation:

```typescript
// Behind the scenes in @ai-sdk/openai:
try {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [...],
    response_format: { type: 'json_schema', schema: yourSchema }
  });
  
  const parsed = yourSchema.parse(response.choices[0].message.content);
  return parsed;
  
} catch (schemaError) {
  // Automatically retries with error message:
  // "Your previous response didn't match the schema. Please fix: [errors]"
}
```

**This means:**
- Our manual retry handles network/API errors
- OpenAI SDK's retry handles schema validation errors
- Combined: robust error handling at multiple levels

---

## Error Types & Handling

### 1. Network Errors

```typescript
// Error: fetch failed, ECONNRESET, timeout
catch (err) {
  // Retry with exponential backoff
  retries++;
  await delay(RETRY_DELAY_MS * retries);
}
```

**Action:** Retry up to MAX_RETRIES

---

### 2. Rate Limit Errors

```typescript
// Error: "Rate limit reached for requests"
if (err.message.includes('Rate limit')) {
  return { error: 'Rate limit', status: 429 };
}
```

**Action:** Stop immediately, return 429

---

### 3. Schema Validation Errors

```typescript
// Error: AI returned invalid JSON
// (Handled automatically by AI SDK's internal retry)
```

**Action:** SDK retries with enhanced prompt, falls back to our manual retry if needed

---

### 4. API Errors (4xx/5xx)

```typescript
// Error: 400 Bad Request, 500 Internal Server Error
catch (err) {
  // Log and retry
  console.error('OpenAI API error:', err);
  retries++;
}
```

**Action:** Retry up to MAX_RETRIES

---

### 5. Max Retries Exceeded

```typescript
if (retries > MAX_RETRIES) {
  return NextResponse.json({
    error: 'Failed after 3 attempts',
    details: lastError.message,
    retryCount: retries - 1,
  }, { status: 500 });
}
```

**Action:** Give up, return 500 with details

---

## Testing Retry Logic

### Simulating Failures

```typescript
// Mock OpenAI to fail first 2 times, succeed on 3rd
let attemptCount = 0;

jest.mock('ai', () => ({
  generateObject: jest.fn().mockImplementation(async () => {
    attemptCount++;
    
    if (attemptCount < 3) {
      throw new Error('Simulated transient failure');
    }
    
    return {
      object: { /* valid analysis */ },
      usage: { promptTokens: 100, completionTokens: 50 },
    };
  }),
}));

// Test
const response = await POST(mockRequest);
expect(response.status).toBe(200);
expect(attemptCount).toBe(3); // Succeeded on 3rd attempt
```

---

### Testing Rate Limit Handling

```typescript
jest.mock('ai', () => ({
  generateObject: jest.fn().mockRejectedValue(
    new Error('Rate limit reached for requests')
  ),
}));

const response = await POST(mockRequest);
const json = await response.json();

expect(response.status).toBe(429);
expect(json.isRateLimit).toBe(true);
expect(json.retryCount).toBe(0); // Stopped immediately
```

---

## Retry Best Practices

### 1. Always Use Exponential Backoff

```typescript
// ❌ Bad: Fixed delay
await delay(1000);
await delay(1000);
await delay(1000);

// ✅ Good: Exponential backoff
await delay(1000 * 1); // 1s
await delay(1000 * 2); // 2s
await delay(1000 * 4); // 4s
```

---

### 2. Set Reasonable Max Retries

```typescript
// ❌ Bad: Too many retries
const MAX_RETRIES = 10; // User waits too long

// ❌ Bad: Too few retries
const MAX_RETRIES = 0; // No resilience

// ✅ Good: 2-3 retries
const MAX_RETRIES = 2; // Total 3 attempts, ~3-6 second delay
```

---

### 3. Don't Retry on Client Errors

```typescript
if (err.status >= 400 && err.status < 500) {
  // Client error (bad request, auth failure)
  // Retrying won't help
  return error;
}

if (err.status >= 500) {
  // Server error (transient issue)
  // Retry may succeed
  retries++;
}
```

---

### 4. Log Each Attempt

```typescript
console.log(`[API] Attempt ${retries + 1}/${MAX_RETRIES + 1}`);
console.log('[API] Request:', { contractType, jurisdiction, persona });

try {
  // ...
  console.log('[API] Success');
} catch (err) {
  console.error(`[API] Attempt ${retries + 1} failed:`, err.message);
}
```

**Benefits:**
- Debug issues in production
- Track success rates
- Identify patterns (e.g., "always fails on 2nd try")

---

### 5. Return Retry Count in Response

```typescript
return NextResponse.json({
  analysis: result.object,
  retryCount: retries, // 0 = success on first try, 1 = success on 2nd try
  // ...
});
```

**Use Cases:**
- Monitor how often retries are needed
- Alert if retry rate increases (sign of API instability)
- Display to user ("Analysis took 2 attempts")

---

## Client-Side Retry (Future Enhancement)

For even more resilience, implement retry logic on the client:

```typescript
async function analyzeWithRetry(contractText: string, maxRetries = 2) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const response = await fetch('/api/contract/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText,
          contractType: 'employment_offer',
          jurisdiction: 'us_general',
          persona: 'employee',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        // Don't retry on rate limits or client errors
        if (error.isRateLimit || response.status < 500) {
          throw new Error(error.error);
        }
        
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (err) {
      console.error(`Client-side retry attempt ${retries + 1}:`, err);
      retries++;
      
      if (retries > maxRetries) {
        throw err;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));
    }
  }
}
```

**Result:**
- Server retries: 3 attempts
- Client retries: 3 attempts
- Total possible attempts: 9 (3 × 3)
- Extreme resilience for flaky networks

---

## Monitoring Retry Rates

Track retry metrics in production:

```typescript
// Track in database or analytics
await db.insert({
  endpoint: '/api/contract/analyze',
  retryCount: retries,
  success: result !== null,
  processingTime,
  timestamp: new Date(),
});

// Alert if retry rate > 20%
if (retryRate > 0.2) {
  sendAlert('High retry rate detected: ' + retryRate);
}
```

---

**End of Retry Logic Examples**
