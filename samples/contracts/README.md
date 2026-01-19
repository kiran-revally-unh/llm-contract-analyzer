# Sample Contracts

This folder contains example contracts for testing Coco's analysis capabilities.

---

## Available Samples

### 1. Employment Offer Letter
**File:** `employment_offer.txt`  
**Type:** Employment contract  
**Parties:** TechStart Inc. (employer) and John Smith (employee)  
**Key Terms:**
- $150,000 salary + 10,000 stock options
- At-will employment
- Broad IP assignment clause
- 12-month non-compete
- No severance terms

**Use Case:** Test analysis from employee perspective

---

### 2. SaaS Terms of Service
**File:** `saas_tos.txt`  
**Type:** Software subscription agreement  
**Provider:** CloudApp Inc.  
**Key Terms:**
- $29-$299/month pricing tiers
- No refunds policy
- Perpetual content license
- Forced arbitration
- No uptime guarantee
- Account termination without cause

**Use Case:** Test analysis from user/customer perspective

---

### 3. Mutual NDA
**File:** `nda_mutual.txt`  
**Type:** Non-disclosure agreement  
**Parties:** TechCorp Inc. and StartupCo LLC  
**Key Terms:**
- 5-year confidentiality obligation
- Mutual obligations (balanced)
- Standard exceptions (public info, prior knowledge)
- 5-year survival after termination
- California jurisdiction

**Use Case:** Test analysis of balanced, two-way agreements

---

### 4. Commercial Lease
**File:** `commercial_lease.txt`  
**Type:** Office lease agreement  
**Parties:** Property Holdings LLC (landlord) and StartupCo Inc. (tenant)  
**Key Terms:**
- $7,500/month base rent + $4,725 additional costs
- 3-year term with 7% annual increases
- Landlord can terminate anytime with 60 days' notice
- Tenant responsible for all repairs/maintenance
- 200% rent penalty for holdover
- Landlord not liable for any damages

**Use Case:** Test analysis of commercial real estate agreements

---

## How to Use These Samples

### Option 1: Copy-Paste

1. Open a sample file in a text editor
2. Copy the entire content (Cmd+A, Cmd+C)
3. Go to http://localhost:3000
4. Paste into the text area (Cmd+V)
5. Select the matching contract type
6. Click "Analyze"

### Option 2: File Upload

1. Go to http://localhost:3000
2. Click "Attach Contract" button
3. Select a sample .txt file
4. Click "Analyze"

### Option 3: Drag & Drop

1. Go to http://localhost:3000
2. Drag a sample file from Finder
3. Drop it onto the upload area
4. Click "Analyze"

---

## Expected Analysis Results

### Employment Offer
- **Risk Score:** ~70-75 (Medium-High)
- **Top Risks:**
  - Non-compete clause (12 months, nationwide)
  - Broad IP assignment
  - No severance protection
- **Missing Clauses:**
  - Severance terms
  - Work hours definition
  - Equity acceleration on termination

### SaaS TOS
- **Risk Score:** ~80-90 (High)
- **Top Risks:**
  - No refunds
  - Perpetual content license
  - Account termination without cause
  - No SLA
- **Missing Clauses:**
  - Uptime guarantee
  - Data export rights
  - Pro-rated refunds

### Mutual NDA
- **Risk Score:** ~40-50 (Low-Medium)
- **Top Risks:**
  - Long confidentiality period (5 years)
  - Broad definition of confidential info
- **Strengths:**
  - Mutual obligations
  - Standard exceptions
  - Reasonable terms

### Commercial Lease
- **Risk Score:** ~75-85 (High)
- **Top Risks:**
  - Landlord can terminate anytime
  - No cap on CAM increases
  - Landlord not liable for damages
  - 200% holdover penalty
- **Missing Clauses:**
  - Tenant termination rights
  - CAM cap
  - Damage liability limits

---

## Creating Your Own Test Contracts

### Format Requirements

1. **Plain text (.txt)** - Not PDF or DOCX (though those work too)
2. **Minimum 50 characters** - Contracts must have meaningful length
3. **Structured sections** - Include section numbers/headers
4. **Clear terms** - Make clauses explicit for better analysis

### Example Structure

```
CONTRACT TITLE

Parties:
Company Name
Person/Entity Name

Terms:

1. Section One
   Text of first section...

2. Section Two
   Text of second section...

Signatures:
[Signature blocks]
```

### Tips for Good Test Data

- **Include specific numbers** - Dates, dollar amounts, percentages
- **Use legal terms** - "At-will," "indemnification," "arbitration," etc.
- **Mix risk levels** - Include both fair and unfair clauses
- **Add missing clauses** - Test if AI identifies what's absent
- **Vary complexity** - Short clauses and long complex ones

---

## Modifying Samples

Feel free to edit these samples to test different scenarios:

### Test Ideas

1. **Remove a risky clause** - Does the risk score drop?
2. **Add severance terms** - Does AI detect the improvement?
3. **Change numbers** - Try 6-month vs. 12-month non-compete
4. **Switch perspectives** - Analyze same contract as employee vs. company
5. **Add ambiguous language** - Test confidence scoring
6. **Test edge cases** - Very short contracts, missing sections, etc.

---

## Real-World Contracts

**⚠️ IMPORTANT:** Do not upload real contracts containing:
- Personal identifying information (SSN, DOB, addresses)
- Protected health information (medical records, diagnoses)
- Credit card numbers or financial account details
- Trade secrets or confidential business information
- Any data subject to GDPR, HIPAA, or other privacy laws

**Always redact sensitive information before testing with real contracts.**

---

## Contributing Samples

If you have interesting sample contracts to add:

1. Remove all PII and confidential information
2. Use placeholder names (TechCorp, John Smith, etc.)
3. Ensure the contract is legal to share
4. Create a .txt version
5. Submit via pull request with description

---

## Legal Disclaimer

These sample contracts are for testing and educational purposes only. They are not actual legal agreements and should not be used as templates for real contracts. Always have a licensed attorney draft or review any contract you intend to sign.

---

**Need more samples?** Check online resources like:
- [AIGA Standard Form of Agreement for Design Services](https://www.aiga.org/resources/standard-agreement)
- [Y Combinator SAFE (Simple Agreement for Future Equity)](https://www.ycombinator.com/documents)
- [Cooley GO Document Generators](https://www.cooleygo.com/documents/)
- [Docracy Free Legal Documents](https://www.docracy.com/)
