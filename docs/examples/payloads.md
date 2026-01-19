# Example API Payloads

This document shows real request and response examples for Coco's API endpoints.

---

## POST /api/contract/analyze

### Example 1: Employment Offer Letter

#### Request

```json
{
  "contractText": "EMPLOYMENT OFFER LETTER\n\nDear John Smith,\n\nWe are pleased to offer you the position of Senior Software Engineer at Acme Corp, reporting to the VP of Engineering.\n\nCompensation:\n- Base Salary: $150,000/year\n- Stock Options: 10,000 shares with 4-year vesting\n- Benefits: Health, dental, vision insurance; 401(k) matching\n\nStart Date: March 1, 2026\n\nTerms:\n1. This is an at-will employment arrangement. Either party may terminate employment at any time, with or without cause, and with or without notice.\n\n2. Intellectual Property: All inventions, discoveries, and works of authorship conceived or made by Employee during employment, whether or not during working hours, shall be the sole property of Company.\n\n3. Non-Compete: Employee agrees not to engage in competing business activities or solicit Company clients or employees for twelve (12) months following termination of employment, to the extent permitted by law.\n\n4. Confidentiality: Employee shall maintain confidentiality of all proprietary information indefinitely.\n\nPlease sign and return this letter by February 15, 2026 to accept this offer.\n\nSincerely,\nJane Doe\nVP of Engineering\nAcme Corp",
  "contractType": "employment_offer",
  "jurisdiction": "us_general",
  "persona": "employee",
  "modelId": "gpt-4o"
}
```

#### Response (200 OK)

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
        "category": "termination",
        "risk": "medium",
        "who_benefits": "company",
        "why_risky": "At-will employment means you can be fired at any time without cause or notice, providing no job security.",
        "evidence_quotes": [
          {
            "quote": "This is an at-will employment arrangement. Either party may terminate employment at any time, with or without cause, and with or without notice.",
            "location": "Terms, Section 1"
          }
        ],
        "pushback": "Request a notice period (e.g., 30 days) or severance terms if terminated without cause.",
        "suggested_revision": "Company agrees to provide 30 days' written notice or 30 days' base salary as severance if Employee is terminated without cause.",
        "severity_reasoning": "At-will employment is standard in the US but leaves you vulnerable to sudden job loss without financial protection."
      },
      {
        "id": "2",
        "category": "ip",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "All inventions created during employment belong to the company, even if made outside work hours or using personal resources. This prevents you from working on side projects.",
        "evidence_quotes": [
          {
            "quote": "All inventions, discoveries, and works of authorship conceived or made by Employee during employment, whether or not during working hours, shall be the sole property of Company.",
            "location": "Terms, Section 2, Intellectual Property"
          }
        ],
        "pushback": "Request an exclusion for inventions created entirely on personal time, using personal resources, and unrelated to company business.",
        "suggested_revision": "Exclude inventions that are: (a) developed entirely on Employee's own time; (b) without using Company equipment, supplies, facilities, or trade secret information; and (c) do not relate to Company's business or actual or demonstrably anticipated research.",
        "severity_reasoning": "Broad IP clauses can prevent you from creating your own products or working on side projects, even if they don't compete with the company."
      },
      {
        "id": "3",
        "category": "non_compete",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "The 12-month non-compete restricts your ability to work in your field after leaving the company, which may be unenforceable in California but could limit job opportunities in other states.",
        "evidence_quotes": [
          {
            "quote": "Employee agrees not to engage in competing business activities or solicit Company clients or employees for twelve (12) months following termination of employment, to the extent permitted by law.",
            "location": "Terms, Section 3, Non-Compete"
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
        "recommended_language": "In the event of termination without cause, Company shall provide Employee with three (3) months of base salary as severance, continued health insurance for six (6) months, and immediate vesting of 25% of unvested equity."
      },
      {
        "category": "Work Hours / Overtime",
        "why_it_matters": "No mention of expected work hours or overtime compensation, which could lead to exploitation or burnout.",
        "recommended_language": "Employee's standard work hours are 40 hours per week. Any work beyond 45 hours per week requires prior approval and will be compensated with additional PTO at a rate of 1.5 days per day of overtime."
      }
    ],
    "recommendations": [
      "Negotiate the non-compete period down to 6 months maximum and limit to direct competitors",
      "Request written clarification on intellectual property created outside of work hours using personal resources",
      "Ask for severance terms to be explicitly stated in the offer (3 months salary recommended)",
      "Consider having the contract reviewed by an employment attorney in your state before signing"
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

### Example 2: SaaS Terms of Service

#### Request

```json
{
  "contractText": "TERMS OF SERVICE\n\nEffective Date: January 1, 2026\n\n1. ACCEPTANCE OF TERMS\nBy accessing or using CloudApp's services, you agree to be bound by these Terms of Service.\n\n2. SUBSCRIPTION AND PAYMENT\n- Monthly subscription: $99/month, billed automatically\n- Annual subscription: $990/year (2 months free)\n- Auto-renewal: Your subscription will automatically renew unless canceled 30 days before renewal date\n- No refunds for partial months or unused time\n\n3. DATA AND PRIVACY\n- We collect your name, email, payment information, and usage data\n- We may use your data to improve our services and for marketing purposes\n- We may share your data with third-party service providers\n- You retain ownership of your content, but grant us a perpetual license to use, modify, and display it\n\n4. LIMITATION OF LIABILITY\nCloudApp shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including lost profits, data loss, or business interruption. Our total liability shall not exceed the amount you paid in the last 12 months.\n\n5. DISPUTE RESOLUTION\nAny dispute arising from these terms shall be resolved through binding arbitration in San Francisco, California. You waive your right to participate in a class action lawsuit.\n\n6. CHANGES TO TERMS\nWe reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance.\n\n7. TERMINATION\nWe may suspend or terminate your account at any time, with or without cause, without notice or refund.",
  "contractType": "tos",
  "jurisdiction": "us_general",
  "persona": "user",
  "modelId": "gpt-4o"
}
```

#### Response (200 OK)

```json
{
  "analysis": {
    "overall": {
      "risk_score": 78,
      "risk_level": "high",
      "confidence": 0.91,
      "contract_type": "tos",
      "jurisdiction": "us_general",
      "persona": "user"
    },
    "clauses": [
      {
        "id": "1",
        "category": "payment",
        "risk": "medium",
        "who_benefits": "company",
        "why_risky": "Auto-renewal with a 30-day cancellation window and no refunds for partial months means you could be charged unexpectedly if you forget to cancel.",
        "evidence_quotes": [
          {
            "quote": "Your subscription will automatically renew unless canceled 30 days before renewal date. No refunds for partial months or unused time.",
            "location": "Section 2, Subscription and Payment"
          }
        ],
        "pushback": "Request a shorter cancellation window (e.g., 7 days before renewal) and pro-rated refunds for unused time.",
        "suggested_revision": "Subscription auto-renews unless canceled at least 7 days before renewal date. Refunds will be pro-rated for any unused time if you cancel mid-term.",
        "severity_reasoning": "Auto-renewal is common but a 30-day window is longer than industry standard (usually 5-7 days). No refunds policy is aggressive."
      },
      {
        "id": "2",
        "category": "privacy",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "The company can use your data for marketing and share it with third parties without specific limits on how it's used or who receives it.",
        "evidence_quotes": [
          {
            "quote": "We may use your data to improve our services and for marketing purposes. We may share your data with third-party service providers.",
            "location": "Section 3, Data and Privacy"
          }
        ],
        "pushback": "Request clarity on which third parties receive your data and ask for opt-out options for marketing use.",
        "suggested_revision": "We will only share your data with third-party processors necessary to provide the service (e.g., payment processors, hosting providers). You may opt out of marketing communications at any time.",
        "severity_reasoning": "Vague data sharing policies can expose your information to unexpected parties. Lack of opt-out for marketing is concerning."
      },
      {
        "id": "3",
        "category": "ip",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "You grant a perpetual license for the company to use, modify, and display your content, which means they can continue using it even after you delete your account.",
        "evidence_quotes": [
          {
            "quote": "You retain ownership of your content, but grant us a perpetual license to use, modify, and display it.",
            "location": "Section 3, Data and Privacy"
          }
        ],
        "pushback": "Request that the license terminates when you delete your account or cancel your subscription.",
        "suggested_revision": "You grant us a license to use, modify, and display your content solely for the purpose of providing the service. This license terminates when you delete your content or close your account.",
        "severity_reasoning": "Perpetual licenses are aggressive and mean the company can use your content forever, even if you leave the platform."
      },
      {
        "id": "4",
        "category": "liability",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "The company disclaims all liability for consequential damages, including data loss, which means if they lose your data, you have no recourse beyond the subscription fees you paid.",
        "evidence_quotes": [
          {
            "quote": "CloudApp shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including lost profits, data loss, or business interruption. Our total liability shall not exceed the amount you paid in the last 12 months.",
            "location": "Section 4, Limitation of Liability"
          }
        ],
        "pushback": "Request that liability for data loss be uncapped or set at a higher threshold (e.g., 12 months of fees minimum).",
        "suggested_revision": "Company's total liability for ordinary negligence shall not exceed the greater of: (a) $10,000 or (b) the amount you paid in the last 12 months. Liability for gross negligence or willful misconduct shall not be limited.",
        "severity_reasoning": "Capping liability at 12 months of fees (max $1,188 for annual plan) is very low if the service loses critical business data."
      },
      {
        "id": "5",
        "category": "arbitration",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "Forced arbitration with a class-action waiver prevents you from joining with other users to sue the company, making it expensive and difficult to pursue legal claims.",
        "evidence_quotes": [
          {
            "quote": "Any dispute arising from these terms shall be resolved through binding arbitration in San Francisco, California. You waive your right to participate in a class action lawsuit.",
            "location": "Section 5, Dispute Resolution"
          }
        ],
        "pushback": "Request a carve-out for small claims court or ask for the arbitration location to be in your home state.",
        "suggested_revision": "Either party may pursue disputes in small claims court if the claim qualifies. Otherwise, disputes shall be resolved through arbitration in the claimant's home state.",
        "severity_reasoning": "Class-action waivers favor companies by making it uneconomical for users to pursue small claims. San Francisco location adds travel costs for non-CA users."
      },
      {
        "id": "6",
        "category": "termination",
        "risk": "high",
        "who_benefits": "company",
        "why_risky": "The company can terminate your account at any time without cause, notice, or refund, meaning you could lose access to your data and paid subscription with no recourse.",
        "evidence_quotes": [
          {
            "quote": "We may suspend or terminate your account at any time, with or without cause, without notice or refund.",
            "location": "Section 7, Termination"
          }
        ],
        "pushback": "Request that termination without cause requires 30 days' notice and a pro-rated refund.",
        "suggested_revision": "Company may terminate your account with 30 days' written notice and will provide a pro-rated refund of any prepaid fees. Termination for cause (e.g., violation of terms) may be immediate but requires notice.",
        "severity_reasoning": "Immediate termination without refund is extremely aggressive and could leave you locked out of your data without warning."
      }
    ],
    "missing_or_weak_clauses": [
      {
        "category": "Service Level Agreement (SLA)",
        "why_it_matters": "No uptime guarantee or compensation for downtime is provided, meaning the service could be unavailable frequently with no recourse.",
        "recommended_language": "Company guarantees 99.9% uptime per month. If uptime falls below this threshold, customers will receive a service credit equal to one (1) day of service for each 1% below the guarantee."
      },
      {
        "category": "Data Export and Portability",
        "why_it_matters": "No mention of how you can export your data if you cancel, which could make it difficult to switch providers.",
        "recommended_language": "Upon cancellation, you may export all your data in a standard format (e.g., CSV, JSON) for 30 days after termination."
      }
    ],
    "recommendations": [
      "Request a shorter auto-renewal cancellation window (7 days instead of 30)",
      "Ask for the perpetual content license to terminate when you close your account",
      "Negotiate for liability cap to be increased (at least $10,000 or 12 months of fees, whichever is greater)",
      "Request a carve-out for small claims court instead of forced arbitration",
      "Ask for 30 days' notice before account termination without cause",
      "Ensure you can export your data if you cancel",
      "Consider whether the risks of this service are acceptable for your use case, or look for alternatives with better terms"
    ]
  },
  "processingTime": 10123,
  "tokensUsed": {
    "input": 1821,
    "output": 1243,
    "total": 3064
  },
  "modelUsed": "gpt-4o",
  "estimatedCost": 0.024976,
  "retryCount": 0
}
```

---

## POST /api/extract-pdf

### Example Request (cURL)

```bash
curl -X POST http://localhost:3000/api/extract-pdf \
  -F "file=@employment_offer.pdf"
```

### Example Response (200 OK)

```json
{
  "text": "EMPLOYMENT OFFER LETTER\n\nDear John Smith,\n\nWe are pleased to offer you the position of Senior Software Engineer at Acme Corp...\n\n[Full extracted text here]"
}
```

### Error Response (400 Bad Request - No File)

```json
{
  "error": "No file uploaded"
}
```

### Error Response (400 Bad Request - Invalid PDF)

```json
{
  "error": "Failed to parse PDF",
  "details": "PDF parsing error: Invalid PDF structure"
}
```

---

## Error Response Examples

### 400 - Invalid Request Body

```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "too_small",
      "minimum": 50,
      "path": ["contractText"],
      "message": "String must contain at least 50 character(s)"
    },
    {
      "code": "invalid_enum_value",
      "path": ["contractType"],
      "message": "Invalid enum value. Expected 'tos' | 'nda' | 'employment_offer' | 'saas_agreement' | 'lease' | 'other', received 'unknown'"
    }
  ]
}
```

---

### 429 - Rate Limit Exceeded

```json
{
  "error": "OpenAI rate limit reached",
  "details": "You exceeded your current quota, please check your plan and billing details",
  "isRateLimit": true,
  "retryCount": 0
}
```

---

### 500 - OpenAI API Error

```json
{
  "error": "Failed to analyze contract after 3 attempts",
  "details": "OpenAI API error: Connection timeout",
  "retryCount": 2
}
```

---

### 500 - Schema Validation Error

```json
{
  "error": "AI response validation failed",
  "details": "AI returned invalid JSON schema after 3 retries",
  "retryCount": 2
}
```

---

## JavaScript/TypeScript Examples

### Analyze Contract (Fetch API)

```typescript
async function analyzeContract(contractText: string) {
  try {
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
    
    const data = await response.json();
    console.log('Risk Score:', data.analysis.overall.risk_score);
    console.log('High Risk Clauses:', data.analysis.clauses.filter(c => c.risk === 'high').length);
    
    return data;
    
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}
```

---

### Extract PDF (FormData)

```typescript
async function extractPdfText(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/extract-pdf', {
      method: 'POST',
      body: formData, // Don't set Content-Type, browser does it automatically
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    return data.text;
    
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw error;
  }
}
```

---

## Python Examples

### Analyze Contract (requests)

```python
import requests
import json

def analyze_contract(contract_text):
    url = 'http://localhost:3000/api/contract/analyze'
    payload = {
        'contractText': contract_text,
        'contractType': 'employment_offer',
        'jurisdiction': 'us_general',
        'persona': 'employee',
        'modelId': 'gpt-4o'
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        print(f"Risk Score: {data['analysis']['overall']['risk_score']}")
        print(f"Processing Time: {data['processingTime']}ms")
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"Analysis failed: {e}")
        raise

# Usage
with open('contract.txt', 'r') as f:
    contract_text = f.read()

result = analyze_contract(contract_text)
```

---

### Extract PDF (requests with multipart)

```python
def extract_pdf_text(pdf_path):
    url = 'http://localhost:3000/api/extract-pdf'
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(url, files=files, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data['text']
            
    except requests.exceptions.RequestException as e:
        print(f"PDF extraction failed: {e}")
        raise

# Usage
text = extract_pdf_text('employment_offer.pdf')
print(text[:500])  # Print first 500 chars
```

---

**End of Payload Examples**
