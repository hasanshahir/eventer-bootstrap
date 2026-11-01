# Contributing to Eventr

Thank you for your interest in contributing to Eventr! We welcome contributions to make Pakistan's developer ecosystem more connected, discoverable, and accessible.

---

## Code of Conduct

Eventr follows an inclusive, respectful code of conduct. Harassment, abuse, or discriminatory behaviour of any kind will not be tolerated.

---

## Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/eventer-bootstrap.git
   cd eventer-bootstrap
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure local environment variables**:
   Copy `.env.example` to `.env` and configure local secrets.

4. **Run migrations and seeds**:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

---

## Testing & Quality Assurance

Before submitting any Pull Request, ensure that all quality gates pass:

```bash
# 1. Vitest Unit & Integration suite (must have 100% pass rate)
npm test

# 2. TypeScript typecheck (zero errors)
npm run typecheck

# 3. ESLint quality check (zero warnings or errors)
npm run lint

# 4. Production build verification
npm run build

# 5. Playwright E2E and Axe accessibility suite
npm run test:e2e
```

---

## Commit Guidelines

We use conventional commit messages:
- `feat(...)`: A new feature (e.g. `feat(seo): add dynamic sitemap generator`)
- `fix(...)`: A bug fix (e.g. `fix(match): use word-boundary matching`)
- `chore(...)`: Maintenance or tooling changes
- `docs(...)`: Documentation updates

---

## Submitting Pull Requests

1. Create a feature branch: `git checkout -b feat/my-improvement`.
2. Commit your changes following the conventions above.
3. Push to your fork: `git push origin feat/my-improvement`.
4. Open a Pull Request targeting `main`. Include a description of changes and test evidence.

