# 🤝 Contributing to MiniMate

Thank you for your interest in contributing to MiniMate! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct
Please be respectful and inclusive in all interactions.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/minimate.git
   cd minimate
   ```
3. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Frontend Development
```bash
cd frontend
npm run dev
```

### Smart Contract Development
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Pull Request Process

1. **Create a branch** from `master` for your changes
2. **Make your changes** following the coding standards
3. **Test thoroughly** - ensure nothing is broken
4. **Commit** with clear, descriptive messages
5. **Push** to your fork
6. **Open a Pull Request** with:
   - Clear title describing the change
   - Description of what was changed and why
   - Reference any related issues (e.g., "Fixes #123")
   - Screenshots for UI changes

### PR Title Format
```
type(scope): description

Examples:
feat(frontend): add transaction history view
fix(contracts): resolve reentrancy vulnerability
docs(readme): update installation instructions
```

## Coding Standards

### JavaScript/React
- Use functional components with hooks
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic

### Solidity
- Follow Solidity style guide
- Add NatSpec comments
- Use latest stable Solidity version
- Test all functions

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting, missing semicolons, etc.
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high/medium/low` - Priority level
- `area: frontend/contracts/ai` - Area of codebase

## 📞 Questions?

Open a Discussion or reach out on the issue tracker!

---

Thank you for contributing to MiniMate! 🚀
