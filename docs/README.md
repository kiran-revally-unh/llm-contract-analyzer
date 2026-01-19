# Documentation Index

Complete documentation for the Coco Contract Risk Analyzer.

---

## 📚 Main Documentation

### [README.md](../README.md)
- **What it is:** Project overview, features, quick start guide
- **Audience:** Everyone - developers, users, interviewers
- **Key sections:** Tech stack, installation, usage, deployment

### [TECH_REPORT.md](./TECH_REPORT.md)
- **What it is:** Deep technical analysis of architecture and implementation
- **Audience:** Technical interviewers, senior engineers, architects
- **Key sections:**
  - Product overview and user flow
  - Architecture diagram and component breakdown
  - Tech stack deep dive (frontend, backend, AI, validation)
  - Data flow (request → response)
  - Prompting approach and model selection
  - Validation strategy ("retry until valid JSON")
  - Observability (tokens, latency, cost tracking)
  - Security considerations (PII/PHI, rate limiting, key handling)
  - Limitations and future improvements
  - Performance benchmarks
  - Deployment guide

### [API.md](./API.md)
- **What it is:** Complete API reference for all endpoints
- **Audience:** API consumers, integration developers
- **Key sections:**
  - POST /api/contract/analyze (main analysis endpoint)
  - POST /api/extract-pdf (PDF text extraction)
  - Request/response schemas
  - Error handling and status codes
  - Rate limiting
  - Authentication (future)
  - Code examples (JavaScript, Python, cURL)

---

## 💡 Code Examples

Located in `/docs/examples/`:

### [prompt.md](./examples/prompt.md)
- System prompt (productIntelligencePrompt)
- User prompt construction
- Retry prompt enhancements
- Persona-specific prompts
- Category-specific analysis prompts
- Temperature and model comparisons
- Prompt iteration notes

### [schema.ts](./examples/schema.ts)
- Zod schemas (request and response validation)
- EvidenceQuoteSchema
- ClauseSchema
- MissingClauseSchema
- ContractAnalysisSchema
- AnalyzeRequestSchema
- Validation patterns (safeParse, parse, partial)
- Error handling examples
- Testing schemas
- Best practices

### [retry.ts](./examples/retry.ts)
- Full retry implementation from API route
- Exponential backoff strategy
- Enhanced prompts on retry
- Rate limit detection
- Error type handling
- Testing retry logic
- Best practices and pitfalls

### [payloads.md](./examples/payloads.md)
- Real request/response examples
- Employment offer analysis (full JSON)
- SaaS TOS analysis (full JSON)
- PDF extraction examples
- Error response examples (400, 429, 500)
- JavaScript/TypeScript examples (fetch)
- Python examples (requests library)
- cURL examples

---

## 📂 Sample Data

Located in `/samples/`:

### [contracts/](../samples/contracts/)
- `employment_offer.txt` - Tech startup offer letter
- `saas_tos.txt` - SaaS Terms of Service
- `nda_mutual.txt` - Mutual Non-Disclosure Agreement
- `commercial_lease.txt` - Office lease agreement

### [outputs/](../samples/outputs/)
- JSON analysis outputs for each sample contract
- Demonstrates expected format and quality
- Use for testing and validation

### [README.md](../samples/README.md)
- How to use sample contracts
- Expected analysis results
- Creating your own test data
- Contributing samples

---

## 📸 Images

Located in `/docs/images/`:

### Screenshots Needed
- `dashboard-preview.png` - Analysis results page (required for README)
- `homepage.png` - Contract input page (optional)
- `loading-screen.png` - Analysis in progress (optional)
- `category-card-expanded.png` - Detailed view (optional)

See [images/README.md](./images/README.md) for screenshot guidelines.

---

## 🎯 Quick Navigation

**For Interviews:**
1. Start with [README.md](../README.md) for 60-second overview
2. Show [TECH_REPORT.md](./TECH_REPORT.md) for architecture discussion
3. Reference [API.md](./API.md) for implementation details
4. Demo with [sample contracts](../samples/contracts/)

**For Integration:**
1. Read [API.md](./API.md) for endpoint specs
2. Check [payloads.md](./examples/payloads.md) for request/response examples
3. Copy code from [examples/](./examples/) folder
4. Test with [sample contracts](../samples/contracts/)

**For Understanding AI:**
1. Read [prompt.md](./examples/prompt.md) for prompt engineering
2. See [schema.ts](./examples/schema.ts) for validation approach
3. Check [retry.ts](./examples/retry.ts) for error handling
4. Review [TECH_REPORT.md](./TECH_REPORT.md) section on "Prompting Approach"

**For Development:**
1. Clone repo and follow [README.md](../README.md) Quick Start
2. Review [TECH_REPORT.md](./TECH_REPORT.md) for architecture
3. Test with [sample contracts](../samples/contracts/)
4. Consult [API.md](./API.md) for endpoint behavior

---

## 📊 Documentation Coverage

| Topic | Document | Status |
|-------|----------|--------|
| Project Overview | README.md | ✅ Complete |
| Technical Architecture | TECH_REPORT.md | ✅ Complete |
| API Reference | API.md | ✅ Complete |
| Code Examples | examples/*.{md,ts} | ✅ Complete |
| Sample Contracts | samples/contracts/*.txt | ✅ Complete |
| Sample Outputs | samples/outputs/*.json | ⬜ TODO (generate via app) |
| Screenshots | docs/images/*.png | ⬜ TODO (add screenshots) |

---

## 🔄 Keeping Documentation Updated

When you make changes to the code:

1. **Update README.md** if you:
   - Add new features
   - Change installation steps
   - Modify environment variables
   - Update tech stack

2. **Update TECH_REPORT.md** if you:
   - Change architecture
   - Modify data flow
   - Switch AI models
   - Update schemas
   - Add observability

3. **Update API.md** if you:
   - Add/remove/modify endpoints
   - Change request/response formats
   - Update error codes
   - Modify rate limits

4. **Update examples/** if you:
   - Change prompts
   - Modify schemas
   - Update retry logic
   - Add new code patterns

5. **Update samples/** if you:
   - Add new contract types
   - Create better examples
   - Generate new outputs

---

## 📝 Documentation Style Guide

### Headers
- Use `#` for document titles
- Use `##` for major sections
- Use `###` for subsections
- Use `####` for details

### Code Blocks
```typescript
// Always specify language for syntax highlighting
const example = 'like this';
```

### Links
- Internal links: `[Text](./relative/path.md)`
- External links: `[Text](https://example.com)`
- Section links: `[Text](#section-name)`

### Lists
- Use `-` for unordered lists
- Use `1.` for ordered lists
- Indent nested lists with 2 spaces

### Emphasis
- **Bold** for important terms
- `code` for variable names, commands, filenames
- *Italic* for emphasis (use sparingly)

### Examples
- Always include complete, runnable examples
- Show both input and output
- Include error cases
- Add comments for clarity

---

## 🤝 Contributing to Documentation

1. **Fix typos:** Just submit a PR
2. **Add examples:** Add to `/docs/examples/`
3. **Improve explanations:** Edit existing docs
4. **Add screenshots:** Follow guidelines in `/docs/images/README.md`
5. **Create tutorials:** Add to `/docs/tutorials/` (create folder if needed)

---

## 📧 Questions?

If documentation is unclear or missing information:
- Open an issue: [GitHub Issues](https://github.com/yourusername/coco/issues)
- Email: your-email@example.com
- Twitter: [@yourhandle](https://twitter.com/yourhandle)

---

**Last Updated:** January 18, 2026
