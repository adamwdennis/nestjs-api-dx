# Release Process

This project uses **Nx Release** with **tag-based CD** for automated publishing to npm.

## 🎯 Release Strategy

**Fully automated via GitHub Actions:**
1. **GitHub UI:** Trigger release workflow, select version type (patch/minor/major)
2. **GitHub Actions:** Runs tests → bumps version → publishes to npm → creates GitHub release

Zero local setup required - everything happens in one workflow (~3-5 min).

---

## 📋 Prerequisites

### One-time Setup (Required)

**1. Add NPM_TOKEN to GitHub Secrets:**

1. Generate token at: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Create "Automation" token (not "Publish" token)

2. Add to GitHub:
   - Repository → Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: [your npm token]

**2. Enable Branch Protection (Recommended for public repos):**

Settings → Branches → Add branch protection rule:
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass: `main` (CI job)
- ✅ Require branches to be up to date

**That's it!** No local setup needed.

---

## 🚀 Release Workflow

### GitHub UI (Recommended - Zero Local Setup)

1. **Go to Actions tab** in GitHub
   - https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/release-version.yml

2. **Click "Run workflow"**
   - Select version bump: `patch`, `minor`, or `major`
   - Click green "Run workflow" button

3. **Wait for automation** (~3-5 minutes)
   - Runs tests (fails if tests fail)
   - Bumps version + creates commit + tag
   - Builds package
   - Publishes to npm
   - Creates GitHub release

**Version types:**
- `patch`: 0.0.24 → 0.0.25 (bug fixes)
- `minor`: 0.0.24 → 0.1.0 (new features)
- `major`: 0.0.24 → 1.0.0 (breaking changes)

---

### Local (Alternative)

If you prefer local workflow:

```bash
# Patch version (0.0.24 → 0.0.25)
pnpm release:version:patch

# Minor version (0.0.24 → 0.1.0)
pnpm release:version:minor

# Major version (0.0.24 → 1.0.0)
pnpm release:version:major

# Push to remote (triggers publish)
git push && git push --tags
```

**Requirements for local:**
- npm login configured
- GITHUB_TOKEN environment variable set

---

## 📝 Conventional Commits

Use these prefixes for automatic version detection:

```bash
# Patch version bump (0.0.24 → 0.0.25)
git commit -m "fix: resolve cursor encoding issue"
git commit -m "perf: optimize query builder"
git commit -m "docs: update README examples"

# Minor version bump (0.0.24 → 0.1.0)
git commit -m "feat: add filtering support"
git commit -m "feat: implement backward pagination"

# Major version bump (0.0.24 → 1.0.0)
git commit -m "feat!: change paginate API signature

BREAKING CHANGE: paginate() now requires cursorColumn as third argument"
```

**Commit types:**
- `feat:` - New feature (minor bump)
- `fix:` - Bug fix (patch bump)
- `perf:` - Performance improvement (patch bump)
- `docs:` - Documentation only (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `test:` - Test changes (no version bump)
- `chore:` - Build/tooling changes (no version bump)

Add `!` or `BREAKING CHANGE:` for major version bump.

---

## 🔄 Complete Release Example

**Via GitHub UI:**

1. **Merge your feature PR to main**
   ```bash
   # Locally develop feature
   git checkout -b feat/add-reverse-sorting
   # ... make changes ...
   git commit -m "feat: add reverse sorting parameter"
   git push -u origin feat/add-reverse-sorting
   # Create PR, get approval, merge
   ```

2. **Trigger release via GitHub Actions**
   - Go to: https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/release-version.yml
   - Click "Run workflow"
   - Select version type: `minor` (for new feature)
   - Click "Run workflow"

3. **Automation handles everything:**
   - ✅ Runs tests (fails if tests fail)
   - ✅ Builds package
   - ✅ Bumps version to 0.1.0
   - ✅ Generates CHANGELOG.md
   - ✅ Creates commit on main
   - ✅ Creates git tag v0.1.0
   - ✅ Publishes to npm
   - ✅ Creates GitHub release

4. **Done!** Check:
   - npm: https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination
   - GitHub releases: https://github.com/adamwdennis/nestjs-api-dx/releases

---

## 🎬 What Happens During Release

When you trigger the **Release workflow** via GitHub UI:

1. **Checkout code** from main branch
2. **Setup Node.js** and pnpm
3. **Install dependencies** with caching
4. **Run tests** to ensure quality (fails if tests fail)
5. **Build package** for distribution
6. **Bump version** in package.json
7. **Generate CHANGELOG.md** from commits
8. **Create commit + tag** and push to main
9. **Publish to npm** with provenance (supply chain security)
10. **Create GitHub release** with auto-generated notes

View progress: https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/release-version.yml

---

## 🛡️ Safety Checks

The release workflow includes several safety checks:

1. **Test validation**
   ```bash
   # All tests must pass before version bump
   pnpm nx test nestjs-typeorm-cursor-pagination
   # If tests fail, workflow stops immediately
   ```

2. **Build validation**
   ```bash
   # Build must succeed before version bump
   pnpm nx build nestjs-typeorm-cursor-pagination
   # If build fails, workflow stops immediately
   ```

3. **npm provenance** (supply chain security)
   - Links npm package to source code
   - Verifiable build process
   - Requires `id-token: write` permission

**Important:** The workflow runs tests BEFORE bumping the version, so you'll never create a version tag for broken code.

---

## 📊 Monitoring Releases

### npm Package

- **Published packages:** https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination
- **Version history:** Click "Versions" tab
- **Download stats:** https://npmcharts.com/@adamwdennis/nestjs-typeorm-cursor-pagination

### GitHub

- **All releases:** https://github.com/adamwdennis/nestjs-api-dx/releases
- **Tags:** https://github.com/adamwdennis/nestjs-api-dx/tags
- **Release workflow runs:** https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/release.yml

### Nx Cloud

- **Build cache:** https://cloud.nx.app
- **Task distribution:** View performance metrics

---

## 🐛 Troubleshooting

### "Tag already exists"

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Recreate tag
git tag v1.0.0
git push origin v1.0.0
```

### "Version mismatch error"

Ensure package.json version matches tag:

```bash
# Check current version
cat packages/nestjs-typeorm-cursor-pagination/package.json | grep version

# If mismatch, update package.json manually or run:
pnpm release:version 1.0.0
```

### "npm publish failed - 403"

Check npm authentication:

```bash
# Verify you're logged in
npm whoami

# Check token in GitHub secrets
# Ensure NPM_TOKEN is set and valid (Automation token, not Publish)

# Verify package name is not taken
npm view @adamwdennis/nestjs-typeorm-cursor-pagination
```

### "Tests failed in CI"

```bash
# Run tests locally first
pnpm nx test nestjs-typeorm-cursor-pagination

# Check specific failures
pnpm nx test nestjs-typeorm-cursor-pagination --verbose
```

### "GITHUB_TOKEN not set"

For local release commands that create GitHub releases:

```bash
# Create token: https://github.com/settings/tokens/new
# Required scopes: repo

export GITHUB_TOKEN=your_token_here

# Or add to shell config
echo 'export GITHUB_TOKEN=your_token_here' >> ~/.zshrc
source ~/.zshrc
```

---

## 🔧 Advanced: Dry Run

Test the release process without publishing:

```bash
# Preview version bump
pnpm nx release version --dry-run

# Preview changelog
pnpm nx release changelog --dry-run

# See what would be published
cd dist/packages/nestjs-typeorm-cursor-pagination
npm pack --dry-run
```

---

## 📚 Additional Resources

- **Nx Release docs:** https://nx.dev/features/manage-releases
- **Conventional Commits:** https://www.conventionalcommits.org
- **Semantic Versioning:** https://semver.org
- **npm Provenance:** https://docs.npmjs.com/generating-provenance-statements

---

## 🎯 Quick Reference

**GitHub UI Release (Recommended):**
1. Go to Actions → "Release" workflow
2. Click "Run workflow"
3. Select version type (patch/minor/major)
4. Wait ~3-5 min for automation

**Local Release (Alternative):**
```bash
pnpm release:version:patch        # 0.0.24 → 0.0.25
pnpm release:version:minor        # 0.0.24 → 0.1.0
pnpm release:version:major        # 0.0.24 → 1.0.0
git push && git push --tags
```

**Monitor:**
- Releases: https://github.com/adamwdennis/nestjs-api-dx/releases
- npm: https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination
- Workflows: https://github.com/adamwdennis/nestjs-api-dx/actions
