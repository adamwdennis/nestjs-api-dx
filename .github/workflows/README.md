# CI/CD Workflows

## Current Setup

### Main CI Workflow (`ci.yml`)

Runs on every push to `main` and all pull requests.

**Single job with Nx task orchestration:**

1. **Checkout & Setup** (~30 sec)
   - Single checkout
   - Single pnpm install
   - Nx cache restoration

2. **Run affected tasks** (~2-3 min)
   - Lint affected projects
   - Test affected projects (180+ unit tests)
   - Build affected projects
   - Nx runs tasks in parallel automatically

3. **Run e2e tests** (~1 min)
   - 7 e2e GraphQL query tests
   - Validates real-world usage

**Benefits of single job:**
- ✅ 1 checkout instead of 5
- ✅ 1 pnpm install instead of 5
- ✅ Better Nx cache utilization
- ✅ Nx handles parallelization (respects task dependencies)
- ✅ Only runs tasks for affected projects

**Total time:** ~2-3 minutes

**Cost:** ~$2-5/month on public repos (free for open source)

---

## Additional Workflows

### Dependency Review (`dependency-review.yml`)
- Runs on every PR
- Scans for vulnerable dependencies
- Fails if moderate+ severity vulnerabilities found
- Posts summary comment on PR

### Auto-merge Dependabot (`auto-merge-dependabot.yml`)
- Runs when Dependabot creates PRs
- Auto-merges patch and minor dependency updates
- Requires CI to pass first

### CodeQL Security Scan (`codeql.yml`)
- Runs weekly on Monday
- Analyzes TypeScript code for security vulnerabilities
- Results visible in Security tab

### Stale Issue Management (`stale.yml`)
- Runs daily
- Marks issues/PRs stale after 90 days of inactivity
- Closes after 7 additional days
- Keeps issue tracker clean

---

## Required Secrets

### For NPM Publishing

Required for the release workflow:

1. Generate NPM token: https://www.npmjs.com/settings/[username]/tokens
   - Create an "Automation" token (not "Publish" token)
2. Add to GitHub: Settings → Secrets → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: [your token]

---

## Status Badges

Add to your README.md:

```markdown
[![CI](https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/ci.yml/badge.svg)](https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/ci.yml)
```

---

## Debugging Failed Checks

### Lint Failures

```bash
# Run locally to see issues
pnpm nx affected -t lint

# Auto-fix most issues
pnpm nx affected -t lint --fix
```

### Format Failures

```bash
# Check formatting
pnpm nx format:check

# Fix formatting
pnpm nx format:write
```

### Test Failures

```bash
# Run tests locally
pnpm nx test nestjs-typeorm-cursor-pagination

# Run with coverage
pnpm nx test nestjs-typeorm-cursor-pagination --coverage

# Run specific test file
pnpm nx test nestjs-typeorm-cursor-pagination --testFile=paginate.spec.ts
```

### E2E Failures

```bash
# Run e2e tests locally
pnpm nx e2e sample-nestjs-graphql-api-e2e

# Start app manually and test
pnpm nx serve sample-nestjs-graphql-api
# Then in another terminal:
pnpm nx e2e sample-nestjs-graphql-api-e2e
```

### Build Failures

```bash
# Build library
pnpm nx build nestjs-typeorm-cursor-pagination

# Build all affected
pnpm nx affected -t build
```

---

## Skipping CI

Add to commit message to skip CI run:

```bash
git commit -m "docs: update README [skip ci]"
```

**Note:** Only use for documentation-only changes!

---

## Local Pre-commit Checks

Run before pushing to catch issues early:

```bash
# Quick check (runs in ~30 seconds)
pnpm nx affected -t lint build

# Full check (runs in ~2 minutes)
pnpm nx affected -t lint test build
pnpm nx format:check
```

Consider adding a git pre-commit hook (using Husky):

```bash
pnpm add -D husky lint-staged

# Add to package.json:
{
  "lint-staged": {
    "*.{ts,tsx}": ["nx affected:lint --fix", "nx format:write"],
    "*.{md,json}": ["nx format:write"]
  }
}
```

---

## Performance Tips

### Speed up pnpm install locally

```bash
# Use local cache
pnpm config set store-dir ~/.pnpm-store

# Freeze lockfile (skip resolution)
pnpm install --frozen-lockfile
```

### Speed up tests

```bash
# Run in parallel
pnpm nx affected -t test --parallel=3

# Run only changed tests
pnpm nx affected -t test

# Skip coverage when iterating
pnpm nx test nestjs-typeorm-cursor-pagination --skip-nx-cache
```

---

## Monitoring

**GitHub Actions:**
- View runs: https://github.com/adamwdennis/nestjs-api-dx/actions
- See usage: Settings → Billing → Actions
- View test coverage reports in job artifacts

---

## Troubleshooting

### "Cache not found" warning

This is normal for first runs. Cache builds over time.

### pnpm version mismatch

If you see "Lockfile was generated with pnpm version X but current is Y":

```bash
# Update pnpm globally
npm install -g pnpm@10

# Regenerate lockfile
pnpm install
```

### Node version issues

Ensure your local Node version matches CI:

```bash
node -v  # Should be v20.x
nvm use 20  # If using nvm
```

### Test timeouts in CI

Increase timeout in `jest.config.ts`:

```typescript
export default {
  testTimeout: 30000, // 30 seconds
};
```
