# NestJS API DX

Nx monorepo for production-ready NestJS libraries focused on developer experience.

[![CI](https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/ci.yml/badge.svg)](https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📦 Published Packages

### [@adamwdennis/nestjs-typeorm-cursor-pagination](./packages/nestjs-typeorm-cursor-pagination)

[![npm version](https://img.shields.io/npm/v/@adamwdennis/nestjs-typeorm-cursor-pagination.svg)](https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination)
[![npm downloads](https://img.shields.io/npm/dm/@adamwdennis/nestjs-typeorm-cursor-pagination.svg)](https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination)

Production-ready cursor pagination for NestJS + GraphQL + TypeORM. Relay-spec compliant, drop-in solution with 180+ tests.

**Features:**
- ✅ Relay GraphQL Cursor Connections compliant
- ✅ Forward/backward pagination
- ✅ Advanced filtering (AND/OR logic, 15+ operators)
- ✅ TypeScript-first with full type safety
- ✅ Battle-tested (180+ unit/integration tests)

**Install:**
```bash
npm install @adamwdennis/nestjs-typeorm-cursor-pagination
```

**[📖 Full Documentation](./packages/nestjs-typeorm-cursor-pagination/README.md)**

---

## 🎮 Sample Apps

### [sample-nestjs-graphql-api](./apps/sample-nestjs-graphql-api)

Interactive GraphQL API demonstrating cursor pagination with a Product/Category example.

**Features:**
- 7 pre-configured GraphQL Playground tabs
- Auto-seeded test data (40 products, 3 categories)
- Real-world pagination examples
- Filter demonstrations

**Run locally:**
```bash
pnpm nx serve sample-nestjs-graphql-api
# Open http://localhost:3000/graphql
```

**[📖 Sample Queries](./apps/sample-nestjs-graphql-api/SAMPLE-QUERIES.md)**

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Installation

```bash
# Clone repository
git clone https://github.com/adamwdennis/nestjs-api-dx.git
cd nestjs-api-dx

# Install dependencies
pnpm install

# Run tests
pnpm nx test nestjs-typeorm-cursor-pagination

# Run sample app
pnpm nx serve sample-nestjs-graphql-api
```

---

## 🏗️ Project Structure

```
nestjs-api-dx/
├── packages/
│   └── nestjs-typeorm-cursor-pagination/  # Published npm package
├── apps/
│   ├── sample-nestjs-graphql-api/          # Sample GraphQL API
│   └── sample-nestjs-graphql-api-e2e/      # E2E tests
├── .github/
│   └── workflows/                          # CI/CD workflows
├── RELEASE.md                              # Release process docs
└── nx.json                                 # Nx configuration
```

---

## 🔧 Development

### Common Commands

```bash
# Run tests for library
pnpm nx test nestjs-typeorm-cursor-pagination

# Run tests with coverage
pnpm nx test nestjs-typeorm-cursor-pagination --coverage

# Lint library
pnpm nx lint nestjs-typeorm-cursor-pagination

# Build library
pnpm nx build nestjs-typeorm-cursor-pagination

# Run all affected tasks
pnpm nx affected -t lint test build

# View project graph
pnpm nx graph
```

### Testing

- **Unit/Integration Tests:** 180+ tests in `nestjs-typeorm-cursor-pagination`
- **E2E Tests:** 7 GraphQL query tests in `sample-nestjs-graphql-api-e2e`

Run locally:
```bash
pnpm nx test nestjs-typeorm-cursor-pagination
pnpm nx e2e sample-nestjs-graphql-api-e2e
```

---

## 📋 Release Process

Releases are fully automated via GitHub Actions.

**Quick release:**
1. Go to [Actions → Release](https://github.com/adamwdennis/nestjs-api-dx/actions/workflows/release-version.yml)
2. Click "Run workflow"
3. Select version type (patch/minor/major)
4. Wait ~3-5 min for automation

**[📖 Full Release Documentation](./RELEASE.md)**

---

## 🤖 CI/CD

### Workflows

- **[CI](./.github/workflows/ci.yml)** - Runs on all PRs (lint, test, build)
- **[Release](./.github/workflows/release-version.yml)** - Manual release via GitHub UI
- **[Dependency Review](./.github/workflows/dependency-review.yml)** - Security scanning on PRs
- **[CodeQL](./.github/workflows/codeql.yml)** - Weekly security scanning
- **[Auto-merge Dependabot](./.github/workflows/auto-merge-dependabot.yml)** - Automated dependency updates

**[📖 Workflows Documentation](./.github/workflows/README.md)**

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 🔗 Links

- **npm Package:** https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination
- **GitHub Releases:** https://github.com/adamwdennis/nestjs-api-dx/releases
- **CI/CD Runs:** https://github.com/adamwdennis/nestjs-api-dx/actions
- **Issues:** https://github.com/adamwdennis/nestjs-api-dx/issues

---

<div align="center">
  <sub>Built with <a href="https://nx.dev">Nx</a> • Powered by <a href="https://nestjs.com">NestJS</a></sub>
</div>
