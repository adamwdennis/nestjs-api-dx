# Release Process

This project uses **Nx Release** with **tag-based CD** for automated publishing to npm.

## 🎯 Release Strategy

**Hybrid approach:**
1. **Local:** Version bump + changelog generation (via Nx Release)
2. **PR Review:** Team reviews the version bump commit
3. **Merge to main:** Version is updated, but not yet published
4. **Tag creation:** Creates git tag, triggers automated publish
5. **GitHub Actions:** Publishes to npm + creates GitHub release

This gives you control over versioning while automating the publish step.

---

## 📋 Prerequisites

### One-time Setup

1. **npm authentication**
   ```bash
   npm login
   # Use your npm credentials
   ```

2. **GitHub token for Nx Release** (for creating releases)
   ```bash
   # Create a GitHub Personal Access Token with 'repo' scope
   # https://github.com/settings/tokens/new

   # Set as environment variable
   export GITHUB_TOKEN=your_token_here

   # Or add to ~/.bashrc or ~/.zshrc
   echo 'export GITHUB_TOKEN=your_token_here' >> ~/.zshrc
   ```

3. **Add NPM_TOKEN to GitHub Secrets**
   ```bash
   # Generate token at: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   # Create "Automation" token (not "Publish" token)

   # Add to GitHub:
   # Repository → Settings → Secrets and variables → Actions → New repository secret
   # Name: NPM_TOKEN
   # Value: [your npm token]
   ```

   **Note:** This is required for automated publishing via GitHub Actions.

---

## 🚀 Release Workflow

### Option A: Automatic Version (Recommended)

Uses conventional commits to determine version bump automatically.

```bash
# 1. Ensure all commits follow conventional commit format
git log --oneline -10

# Commit types that trigger version bumps:
# - feat: → minor version (0.1.0 → 0.2.0)
# - fix: → patch version (0.1.0 → 0.1.1)
# - BREAKING CHANGE: → major version (0.1.0 → 1.0.0)

# 2. Create version bump (interactive)
pnpm release:version

# This will:
# ✅ Analyze commits since last release
# ✅ Determine version bump automatically
# ✅ Update package.json
# ✅ Generate CHANGELOG.md
# ✅ Create git commit
# ✅ Create git tag

# 3. Push to remote (triggers publish)
git push && git push --tags
```

### Option B: Manual Version

Specify the version bump type explicitly.

```bash
# Patch version (0.0.24 → 0.0.25)
pnpm release:version:patch

# Minor version (0.0.24 → 0.1.0)
pnpm release:version:minor

# Major version (0.0.24 → 1.0.0)
pnpm release:version:major

# Push to remote
git push && git push --tags
```

### Option C: Specific Version

Set exact version number.

```bash
# Set specific version
pnpm nx release version 1.2.3

# Push to remote
git push && git push --tags
```

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

```bash
# 1. Make changes and commit with conventional commit format
git checkout -b feat/add-reverse-sorting
# ... make changes ...
git add .
git commit -m "feat: add reverse sorting parameter"

# 2. Push and create PR
git push -u origin feat/add-reverse-sorting
gh pr create --title "feat: add reverse sorting parameter"

# 3. After PR is approved and merged, checkout main
git checkout main
git pull

# 4. Create version and changelog (DO THIS IN SEPARATE PR)
git checkout -b release/v0.1.0
pnpm release:version
# Review the changes (package.json, CHANGELOG.md)

# 5. Create release PR
git push -u origin release/v0.1.0
gh pr create --title "chore(release): publish v0.1.0" --body "Version bump and changelog"

# 6. After release PR is merged, create tag
git checkout main
git pull
git tag v0.1.0
git push origin v0.1.0

# 7. GitHub Actions automatically:
#    ✅ Runs tests
#    ✅ Builds package
#    ✅ Publishes to npm
#    ✅ Creates GitHub release
```

---

## 🎬 What Happens on Tag Push

When you push a tag (e.g., `v1.0.0`), the **Release workflow** triggers:

1. **Checkout code** at the tagged commit
2. **Setup Node.js** and pnpm
3. **Install dependencies** with frozen lockfile
4. **Run tests** to ensure quality
5. **Build package** for distribution
6. **Verify version** matches tag
7. **Publish to npm** with provenance (supply chain security)
8. **Create GitHub release** with auto-generated changelog

View progress: https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/release.yml

---

## 🛡️ Safety Checks

The release workflow includes several safety checks:

1. **Version mismatch check**
   ```bash
   # Fails if tag doesn't match package.json version
   # Tag: v1.0.0
   # package.json: 0.9.0
   # → ERROR: Version mismatch
   ```

2. **Test validation**
   ```bash
   # All tests must pass before publish
   pnpm nx test nestjs-typeorm-cursor-pagination
   ```

3. **Build validation**
   ```bash
   # Build must succeed before publish
   pnpm nx build nestjs-typeorm-cursor-pagination
   ```

4. **npm provenance** (supply chain security)
   - Links npm package to source code
   - Verifiable build process
   - Requires `id-token: write` permission

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

```bash
# Most common workflow
pnpm release:version              # Auto-detect version bump
git push && git push --tags       # Trigger publish

# Manual version bumps
pnpm release:version:patch        # 0.0.24 → 0.0.25
pnpm release:version:minor        # 0.0.24 → 0.1.0
pnpm release:version:major        # 0.0.24 → 1.0.0

# Check what will happen
pnpm nx release version --dry-run

# View releases
https://github.com/adamwdennis/nestjs-api-dx/releases
https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination
```
