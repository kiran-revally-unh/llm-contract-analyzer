# Example Zod Schemas

This document shows the actual Zod schemas used in Coco for request/response validation.

---

## Import Statement

```typescript
import { z } from 'zod';
```

---

## Request Schema

### AnalyzeRequestSchema

Validates incoming requests to `/api/contract/analyze`:

```typescript
export const AnalyzeRequestSchema = z.object({
  contractText: z.string().min(50, 'Contract text must be at least 50 characters'),
  contractType: z.enum([
    'tos',
    'nda',
    'employment_offer',
    'saas_agreement',
    'lease',
    'other'
  ]),
  jurisdiction: z.enum([
    'us_general',
    'ca',      // California
    'ny',      // New York
    'other'
  ]),
  persona: z.enum([
    'founder',
    'company',
    'user',
    'employee'
  ]),
  modelId: z.string().default('gpt-4o'),
});

// TypeScript type inference
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
```

**Usage:**

```typescript
const parsed = AnalyzeRequestSchema.safeParse(requestBody);

if (!parsed.success) {
  // Validation failed
  return NextResponse.json({
    error: 'Invalid request',
    details: parsed.error.errors
  }, { status: 400 });
}

// Type-safe access
const { contractText, contractType, jurisdiction } = parsed.data;
```

---

## Response Schemas

### EvidenceQuoteSchema

Represents a single evidence quote from the contract:

```typescript
export const EvidenceQuoteSchema = z.object({
  quote: z.string().min(5, 'Quote must be at least 5 characters'),
  location: z.string().min(2, 'Location must be specified'),
});

export type EvidenceQuote = z.infer<typeof EvidenceQuoteSchema>;
```

**Example:**

```typescript
const evidence: EvidenceQuote = {
  quote: "Employee agrees not to engage in competing business activities for twelve (12) months following termination",
  location: "Section 7, Non-Compete Clause"
};
```

---

### ClauseSchema

Represents a single risky clause identified in the contract:

```typescript
export const ClauseSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    'arbitration',
    'liability',
    'termination',
    'ip',
    'non_compete',
    'payment',
    'privacy',
    'data_retention',
    'warranty',
    'governing_law',
    'assignment',
    'nda',
    'other'
  ]),
  risk: z.enum(['low', 'medium', 'high']),
  who_benefits: z.enum(['company', 'user', 'employee', 'neutral']),
  why_risky: z.string().min(5),
  evidence_quotes: z.array(EvidenceQuoteSchema).min(1, 'At least one evidence quote required'),
  pushback: z.string().min(5),
  suggested_revision: z.string().min(5),
  severity_reasoning: z.string().min(5),
});

export type Clause = z.infer<typeof ClauseSchema>;
```

**Example:**

```typescript
const clause: Clause = {
  id: "1",
  category: "non_compete",
  risk: "high",
  who_benefits: "company",
  why_risky: "The 12-month non-compete restricts your ability to work in your field...",
  evidence_quotes: [
    {
      quote: "Employee agrees not to engage in competing business activities...",
      location: "Section 7, Non-Compete and Non-Solicitation"
    }
  ],
  pushback: "Request to reduce the period to 6 months and limit to direct competitors...",
  suggested_revision: "Employee agrees not to directly solicit Company's clients for six (6) months...",
  severity_reasoning: "Non-competes can be difficult to enforce but may still discourage job seeking..."
};
```

---

### MissingClauseSchema

Represents a protection that should exist but doesn't:

```typescript
export const MissingClauseSchema = z.object({
  category: z.string().min(2),
  why_it_matters: z.string().min(5),
  recommended_language: z.string().min(5),
});

export type MissingClause = z.infer<typeof MissingClauseSchema>;
```

**Example:**

```typescript
const missing: MissingClause = {
  category: "Severance Terms",
  why_it_matters: "No severance is specified for termination without cause, leaving you vulnerable to sudden job loss without financial protection.",
  recommended_language: "In the event of termination without cause, Company shall provide Employee with [X] months of base salary as severance, continued health insurance for [Y] months, and immediate vesting of [Z]% of unvested equity."
};
```

---

### ContractAnalysisSchema

The complete response schema:

```typescript
export const ContractAnalysisSchema = z.object({
  overall: z.object({
    risk_score: z.number().min(0).max(100),
    risk_level: z.enum(['low', 'medium', 'high']),
    confidence: z.number().min(0).max(1),
    contract_type: z.enum([
      'tos',
      'nda',
      'employment_offer',
      'saas_agreement',
      'lease',
      'other'
    ]),
    jurisdiction: z.enum(['us_general', 'ca', 'ny', 'other']),
    persona: z.enum(['founder', 'company', 'user', 'employee']),
  }),
  clauses: z.array(ClauseSchema).min(1, 'At least one clause must be identified'),
  missing_or_weak_clauses: z.array(MissingClauseSchema).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;
```

**Example:**

```typescript
const analysis: ContractAnalysis = {
  overall: {
    risk_score: 72,
    risk_level: "medium",
    confidence: 0.89,
    contract_type: "employment_offer",
    jurisdiction: "us_general",
    persona: "employee"
  },
  clauses: [
    {
      id: "1",
      category: "non_compete",
      risk: "high",
      // ... (full clause object)
    }
  ],
  missing_or_weak_clauses: [
    {
      category: "Severance Terms",
      why_it_matters: "No severance specified...",
      recommended_language: "Company shall provide..."
    }
  ],
  recommendations: [
    "Negotiate the non-compete period down to 6 months maximum",
    "Request written clarification on IP created outside work hours",
    "Ask for severance terms to be explicitly stated"
  ]
};
```

---

## Validation Patterns

### Safe Parse (Recommended)

```typescript
const result = ContractAnalysisSchema.safeParse(data);

if (result.success) {
  // Type-safe access to validated data
  const analysis: ContractAnalysis = result.data;
  console.log(analysis.overall.risk_score);
} else {
  // Handle validation errors
  console.error('Validation failed:', result.error.errors);
  
  // Example error structure:
  // [
  //   {
  //     code: 'too_small',
  //     minimum: 1,
  //     path: ['clauses'],
  //     message: 'At least one clause must be identified'
  //   }
  // ]
}
```

---

### Parse with Exception

```typescript
try {
  const analysis = ContractAnalysisSchema.parse(data);
  // Use analysis
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation errors:', error.errors);
  }
}
```

---

### Partial Validation

Validate only certain fields:

```typescript
const PartialClause = ClauseSchema.pick({
  category: true,
  risk: true,
  why_risky: true
});

const partial = PartialClause.parse(data);
// Only validates category, risk, why_risky
```

---

## Schema Extensions

### Adding Custom Validation

```typescript
const EnhancedClauseSchema = ClauseSchema.extend({
  confidence: z.number().min(0).max(1),
  market_standard: z.enum(['standard', 'aggressive', 'unusual']),
}).refine(
  (data) => {
    // Custom validation: high risk should have low confidence
    if (data.risk === 'high' && data.confidence > 0.95) {
      return false;
    }
    return true;
  },
  { message: 'High-risk clauses should have lower confidence scores' }
);
```

---

### Schema Transformation

Transform data during validation:

```typescript
const NormalizedClauseSchema = ClauseSchema.transform((data) => ({
  ...data,
  // Normalize category to lowercase
  category: data.category.toLowerCase(),
  // Trim whitespace from strings
  why_risky: data.why_risky.trim(),
}));
```

---

## Error Handling

### Detailed Error Messages

```typescript
const result = ContractAnalysisSchema.safeParse(data);

if (!result.success) {
  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
  
  // Example output:
  // [
  //   { field: 'overall.risk_score', message: 'Expected number, received string', code: 'invalid_type' },
  //   { field: 'clauses.0.evidence_quotes', message: 'At least one evidence quote required', code: 'too_small' }
  // ]
  
  return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
}
```

---

### Common Validation Errors

#### 1. Missing Required Fields

```typescript
// Input
{ contractText: "..." }
// Missing: contractType, jurisdiction, persona

// Error
{
  code: 'invalid_type',
  path: ['contractType'],
  message: 'Required'
}
```

#### 2. Invalid Enum Value

```typescript
// Input
{ contractType: "unknown_type" }

// Error
{
  code: 'invalid_enum_value',
  path: ['contractType'],
  message: "Invalid enum value. Expected 'tos' | 'nda' | 'employment_offer' | 'saas_agreement' | 'lease' | 'other', received 'unknown_type'"
}
```

#### 3. String Too Short

```typescript
// Input
{ contractText: "Hi" }  // Only 2 characters

// Error
{
  code: 'too_small',
  minimum: 50,
  path: ['contractText'],
  message: 'Contract text must be at least 50 characters'
}
```

#### 4. Array Too Small

```typescript
// Input
{ clauses: [] }  // Empty array

// Error
{
  code: 'too_small',
  minimum: 1,
  path: ['clauses'],
  message: 'At least one clause must be identified'
}
```

---

## Testing Schemas

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ContractAnalysisSchema } from './schemas';

describe('ContractAnalysisSchema', () => {
  it('validates a complete analysis', () => {
    const validAnalysis = {
      overall: {
        risk_score: 72,
        risk_level: 'medium',
        confidence: 0.89,
        contract_type: 'employment_offer',
        jurisdiction: 'us_general',
        persona: 'employee',
      },
      clauses: [
        {
          id: '1',
          category: 'non_compete',
          risk: 'high',
          who_benefits: 'company',
          why_risky: 'Restricts employment options',
          evidence_quotes: [
            {
              quote: 'Employee agrees not to compete...',
              location: 'Section 7',
            },
          ],
          pushback: 'Request shorter period',
          suggested_revision: 'Reduce to 6 months',
          severity_reasoning: 'Limits career mobility',
        },
      ],
      missing_or_weak_clauses: [],
      recommendations: ['Negotiate non-compete'],
    };

    const result = ContractAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects analysis with risk_score > 100', () => {
    const invalid = {
      overall: { risk_score: 150, /* ... */ },
      clauses: [/* ... */],
    };

    const result = ContractAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects clauses without evidence_quotes', () => {
    const invalid = {
      overall: { /* ... */ },
      clauses: [
        {
          id: '1',
          category: 'liability',
          risk: 'high',
          evidence_quotes: [], // Empty array
          /* ... */
        },
      ],
    };

    const result = ContractAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('At least one evidence quote required');
  });
});
```

---

## Schema Versioning

As the API evolves, version schemas for backward compatibility:

```typescript
// v1 schema (current)
export const ContractAnalysisSchemaV1 = z.object({
  overall: z.object({ /* ... */ }),
  clauses: z.array(ClauseSchema),
  // ...
});

// v2 schema (future - adds market_data)
export const ContractAnalysisSchemaV2 = ContractAnalysisSchemaV1.extend({
  market_data: z.object({
    average_risk_score: z.number(),
    percentile: z.number(),
  }).optional(),
});

// Runtime version selection
const schema = version === 'v2' 
  ? ContractAnalysisSchemaV2 
  : ContractAnalysisSchemaV1;
```

---

## Best Practices

### 1. Always Use `.min()` for Arrays and Strings

```typescript
// ❌ Bad: No minimum length
z.string()

// ✅ Good: Enforces meaningful content
z.string().min(5)

// ❌ Bad: Allows empty arrays
z.array(z.string())

// ✅ Good: Requires at least one item
z.array(z.string()).min(1)
```

### 2. Provide Clear Error Messages

```typescript
// ❌ Bad: Generic error
z.string().min(50)

// ✅ Good: Helpful error
z.string().min(50, 'Contract text must be at least 50 characters')
```

### 3. Use Enums for Fixed Values

```typescript
// ❌ Bad: Accepts any string
z.string()

// ✅ Good: Only accepts valid values
z.enum(['low', 'medium', 'high'])
```

### 4. Default Values for Optional Fields

```typescript
// Arrays default to empty
z.array(z.string()).default([])

// Strings default to empty
z.string().default('')

// Booleans default to false
z.boolean().default(false)
```

### 5. Use `.safeParse()` in API Routes

```typescript
// ❌ Bad: Throws exception
const data = schema.parse(input);

// ✅ Good: Returns result object
const result = schema.safeParse(input);
if (!result.success) {
  // Handle error gracefully
}
```

---

**End of Schema Examples**
