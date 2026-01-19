# Contributing to Coco

Thank you for your interest in contributing to Coco! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We expect all contributors to:
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or personal attacks
- Publishing others' private information
- Spam or off-topic comments
- Any conduct that could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Git
- OpenAI API key (for testing)
- Basic knowledge of TypeScript, React, and Next.js

### Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/coco-contract-analyzer.git
   cd coco-contract-analyzer
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/coco-contract-analyzer.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Verify setup**
   - Visit http://localhost:3000
   - Upload a sample contract
   - Ensure analysis works

---

## Development Workflow

### Creating a Branch

Always create a new branch for your work:

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/multi-language-support`)
- `fix/` - Bug fixes (e.g., `fix/pdf-extraction-error`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-analysis-logic`)
- `test/` - Adding tests (e.g., `test/add-api-tests`)

### Making Changes

1. **Write code**
   - Follow coding standards (see below)
   - Add comments for complex logic
   - Update documentation if needed

2. **Test your changes**
   ```bash
   # Run type checking
   npm run type-check
   
   # Run linter
   npm run lint
   
   # Run tests (if available)
   npm test
   
   # Test manually in browser
   npm run dev
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add multi-language support for Spanish"
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
```bash
feat: add PDF export functionality
fix: resolve rate limit error handling
docs: update API documentation for new endpoint
refactor: extract retry logic into separate function
test: add unit tests for schema validation
```

---

## Coding Standards

### TypeScript

- **Use TypeScript for all code** (avoid `any` type)
- **Enable strict mode** in tsconfig.json
- **Define interfaces** for complex objects
- **Use type inference** where possible

**Good:**
```typescript
interface ContractData {
  text: string;
  type: ContractType;
}

function analyzeContract(data: ContractData): Promise<Analysis> {
  // Implementation
}
```

**Bad:**
```typescript
function analyzeContract(data: any): any {
  // Implementation
}
```

### React/Next.js

- **Use functional components** (not class components)
- **Use hooks** for state and side effects
- **Server Components by default** (add 'use client' only when needed)
- **Extract reusable logic** into custom hooks

**Good:**
```typescript
'use client';

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false);
  const { analysis, analyzeContract } = useContractAnalysis();
  
  // Implementation
}
```

### API Routes

- **Validate input** with Zod schemas
- **Handle errors gracefully** with try/catch
- **Return consistent response formats**
- **Add logging** for debugging

**Good:**
```typescript
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    const result = await processRequest(parsed.data);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Styling

- **Use Tailwind CSS** for styling
- **Follow mobile-first** approach
- **Use design system** colors and spacing
- **Avoid inline styles** unless dynamic

**Good:**
```tsx
<div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

### File Organization

```
app/
  (auth)/          # Auth-related pages
  (chat)/          # Main app pages
  api/             # API routes
components/
  ui/              # Reusable UI components
  contract-analyzer/  # Feature-specific components
lib/
  ai/              # AI/OpenAI logic
  contract-analyzer/  # Business logic
  db/              # Database logic
```

---

## Submitting Changes

### Before Submitting

1. **Update main branch**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Rebase your branch**
   ```bash
   git checkout feature/your-feature
   git rebase main
   ```

3. **Run all checks**
   ```bash
   npm run type-check
   npm run lint
   npm test
   ```

4. **Test manually**
   - Run dev server
   - Test your changes
   - Test edge cases

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature
   ```

2. **Open a PR on GitHub**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## How to Test
1. Start dev server
2. Navigate to...
3. Click...
4. Verify...

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass (if applicable)

## Screenshots (if applicable)
[Add screenshots here]
```

### PR Review Process

1. **Automated checks run** (linting, type checking)
2. **Maintainers review** your code
3. **You address feedback** (if any)
4. **PR is merged** once approved

---

## Reporting Bugs

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Verify the bug** still exists in the latest version
3. **Gather information**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/logs
   - Environment (OS, browser, Node version)

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen.

**Actual behavior**
What actually happens.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 18.17.0]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

---

## Suggesting Features

### Before Suggesting

1. **Check roadmap** to see if it's planned
2. **Search existing issues** for similar requests
3. **Consider scope** - Is it aligned with project goals?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Use case**
Real-world scenario where this would be useful.

**Additional context**
Mockups, examples, or related features.
```

---

## Areas for Contribution

### Good First Issues

- Documentation improvements
- Adding test cases
- Fixing typos
- UI/UX enhancements
- Sample contract additions

### Medium Complexity

- New contract types
- Additional validation rules
- Export formats (PDF, DOCX)
- Localization (i18n)
- Performance optimizations

### Advanced

- Machine learning model integration
- Real-time collaboration
- Advanced analytics
- Custom deployment options
- Enterprise features

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

---

## Questions?

- **General questions:** Open a GitHub Discussion
- **Bug reports:** Open a GitHub Issue
- **Security issues:** Email security@example.com (do not open public issues)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Coco! 🎉**
