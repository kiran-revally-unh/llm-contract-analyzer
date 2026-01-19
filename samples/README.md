# Sample Outputs

This folder contains example analysis outputs from Coco for the sample contracts in `/samples/contracts/`.

---

## Output Format

Each output is a JSON file containing:
- **overall** - Risk score, level, confidence, contract type
- **clauses** - Array of risky clauses with evidence quotes
- **missing_or_weak_clauses** - Protections that should exist but don't
- **recommendations** - High-level action items
- **metadata** - Processing time, tokens used, cost

---

## Sample Outputs

### 1. Employment Offer Analysis
**Input:** `/samples/contracts/employment_offer.txt`  
**Output:** `/samples/outputs/employment_offer_analysis.json`  
**Risk Score:** 72/100 (Medium)  
**Key Findings:**
- High-risk non-compete (12 months, nationwide)
- Broad IP assignment (includes personal projects)
- At-will employment without severance
- Missing protections: Severance terms, work hours

---

### 2. SaaS Terms of Service Analysis
**Input:** `/samples/contracts/saas_tos.txt`  
**Output:** `/samples/outputs/saas_tos_analysis.json`  
**Risk Score:** 85/100 (High)  
**Key Findings:**
- No refunds for any reason
- Perpetual content license (even after account closure)
- Forced arbitration with class-action waiver
- Account termination without notice or cause
- No SLA or uptime guarantee
- Unlimited data sharing with third parties

---

### 3. Mutual NDA Analysis
**Input:** `/samples/contracts/nda_mutual.txt`  
**Output:** `/samples/outputs/nda_mutual_analysis.json`  
**Risk Score:** 45/100 (Medium-Low)  
**Key Findings:**
- 5-year confidentiality obligation (long but acceptable for NDAs)
- Broad definition of confidential information
- Mutual obligations (balanced)
- No non-compete restrictions (good)
- Missing: Residual knowledge clause, damages cap

---

### 4. Commercial Lease Analysis
**Input:** `/samples/contracts/commercial_lease.txt`  
**Output:** `/samples/outputs/commercial_lease_analysis.json`  
**Risk Score:** 81/100 (High)  
**Key Findings:**
- Landlord can terminate anytime with 60 days' notice (tenant has no such right)
- 200% rent penalty for holdover
- Tenant liable for all improvements/alterations
- No cap on CAM increases
- Landlord not liable for any property damage
- Jury trial waiver

---

## How to Generate Your Own

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Go to http://localhost:3000**

3. **Select contract type and paste text from `/samples/contracts/`**

4. **Click "Analyze"**

5. **Save the JSON response** (available in browser DevTools Network tab)

---

## Understanding the Outputs

### Overall Section
```json
{
  "risk_score": 72,          // 0-100 (higher = riskier)
  "risk_level": "medium",    // low, medium, high
  "confidence": 0.89,        // 0-1 (AI's confidence in analysis)
  "contract_type": "employment_offer",
  "jurisdiction": "us_general",
  "persona": "employee"      // Who the analysis is for
}
```

### Clause Section
```json
{
  "id": "1",
  "category": "non_compete",
  "risk": "high",
  "who_benefits": "company",
  "why_risky": "Plain-English explanation...",
  "evidence_quotes": [
    {
      "quote": "Exact text from contract (min 15 words)...",
      "location": "Section 7, Non-Compete Clause"
    }
  ],
  "pushback": "How to negotiate...",
  "suggested_revision": "Alternative contract language...",
  "severity_reasoning": "Why this risk level..."
}
```

### Metadata Section
```json
{
  "processingTime": 8234,              // Milliseconds
  "tokensUsed": {
    "input": 1543,                     // Prompt tokens
    "output": 892,                     // Completion tokens
    "total": 2435
  },
  "modelUsed": "gpt-4o",
  "estimatedCost": 0.018915,           // USD
  "retryCount": 0                      // Number of retries (0 = success first try)
}
```

---

## Risk Score Interpretation

| Score | Level | Meaning |
|-------|-------|---------|
| 0-40 | Low | Standard boilerplate, balanced terms, few concerns |
| 41-70 | Medium | Some one-sided terms, vague language, negotiable |
| 71-100 | High | Aggressive terms, missing protections, lawyer needed |

---

## Categories

Clauses are grouped into these categories:

- **arbitration** - Forced arbitration, class-action waivers
- **liability** - Damage caps, disclaimers, indemnification
- **termination** - At-will clauses, notice periods, severance
- **ip** - Intellectual property ownership, work-for-hire
- **non_compete** - Non-compete, non-solicitation restrictions
- **payment** - Pricing, refunds, auto-renewal
- **privacy** - Data collection, sharing, retention
- **data_retention** - How long data is kept
- **warranty** - Warranties, "as-is" disclaimers
- **governing_law** - Which state/country's laws apply
- **assignment** - Can contract be transferred/sold?
- **nda** - Confidentiality obligations
- **other** - Miscellaneous terms

---

## Comparing Outputs

You can compare risk scores across contracts:

```bash
# Employment Offer: 72/100 (Medium)
# SaaS TOS: 85/100 (High)
# NDA: 45/100 (Medium-Low)
# Commercial Lease: 81/100 (High)
```

**Insights:**
- SaaS TOS and Commercial Lease are more aggressive than Employment Offer
- Mutual NDA is the most balanced (both parties have obligations)
- All contracts except NDA have significant power imbalances

---

## Custom Analysis

To analyze your own contracts:

1. **Prepare text** - Copy contract into a .txt file
2. **Remove headers/footers** - Remove page numbers, watermarks
3. **Keep formatting** - Preserve section numbers and structure
4. **Upload to Coco** - Paste or upload via the UI
5. **Select correct type** - Choose the right contract type for better analysis
6. **Choose persona** - Analyze from your perspective (employee, user, company)

---

**Note:** Sample outputs are AI-generated and for demonstration purposes only. They are not legal advice. Always consult with a licensed attorney before signing any contract.
