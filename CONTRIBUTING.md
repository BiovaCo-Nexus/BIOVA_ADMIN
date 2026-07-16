# Contributing to BiovaCo Nexus Admin

Thank you for contributing! Please follow these guidelines to keep the codebase clean, consistent, and easy for every team member to navigate.

---

## Table of Contents

- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Working with Supabase](#working-with-supabase)
- [Environment Variables](#environment-variables)

---

## Branch Naming

Use the following format:

```
<type>/<short-description>
```

| Type | When to use |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Build config, dependency updates |
| `refactor/` | Code restructure (no functional change) |
| `docs/` | Documentation only |
| `hotfix/` | Critical production fix |

**Examples:**
```
feat/knowledge-tracker-multi-assign
fix/intern-management-fetch-bug
chore/update-supabase-sdk
docs/update-readme
```

---

## Commit Messages

Follow the **Conventional Commits** specification:

```
<type>(scope): <short summary>
```

**Examples:**
```
feat(rd-lab): add batch trial cost calculator
fix(auth): redirect to login on session expiry
chore(deps): upgrade @supabase/supabase-js to v2.53
refactor(finance): split FinanceManagement into sub-components
docs: update environment variable instructions in README
```

**Rules:**
- Use present tense ("add", not "added")
- Keep subject line under 72 characters
- Reference issue numbers when applicable: `fix(intern): resolve status update (#42)`

---

## Pull Request Process

1. **Create a branch** from `main` following the naming convention above
2. **Make your changes** in small, focused commits
3. **Test locally** — ensure `npm run dev` works and no TypeScript errors (`npm run lint`)
4. **Open a PR** with:
   - A clear title following the commit message format
   - A description of *what* changed and *why*
   - Screenshots or screen recordings for UI changes
5. **Request review** from at least one team member
6. PRs are merged via **Squash and Merge** to keep `main` history clean

---

## Code Style

- **Language:** TypeScript (strict mode) — avoid `any`
- **Components:** Functional components + React hooks only (no class components)
- **Styling:** Tailwind CSS utility classes; use `cn()` helper for conditional classes
- **Imports:** Use the `@/` alias for all `src/` imports (e.g., `import { Button } from '@/components/ui/button'`)
- **Formatting:** Prettier-compatible style (2-space indent, single quotes)
- **File naming:**
  - Components: `PascalCase.tsx` (e.g., `InternManagement.tsx`)
  - Hooks: `camelCase.ts` with `use` prefix (e.g., `useOfflineSync.ts`)
  - Utilities: `camelCase.ts` (e.g., `pdfGenerator.ts`)

---

## Working with Supabase

### Migrations

All schema changes **must** go through a migration file:

```bash
# Create a new migration
npx supabase migration new your_feature_name

# Apply to remote project
npx supabase db push
```

**Never** make schema changes directly in the Supabase Dashboard SQL editor for production — always use migrations so changes are tracked.

### Edge Functions

```bash
# Deploy a single function
npx supabase functions deploy <function-name>

# Test locally
npx supabase functions serve <function-name>
```

### RLS Policies

Every new table **must** have Row Level Security enabled. Use the security hardening migration as a reference pattern.

---

## Environment Variables

1. **Never commit `.env`** — it is in `.gitignore`
2. **Always update `.env.example`** when you add a new environment variable
3. Use descriptive names with the `VITE_` prefix for client-side vars
4. Server-side only vars (used in Edge Functions) should **not** have the `VITE_` prefix
