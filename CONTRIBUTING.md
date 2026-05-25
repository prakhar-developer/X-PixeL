# Contributing to X-Pixel

## Development Setup

### Prerequisites
- Node.js 18+
- Yarn 3+
- Git

### Initial Setup
```bash
git clone <repo>
cd x-pixel
yarn install
```

## Code Style

- **Language**: TypeScript
- **Format**: Prettier (auto-formatted on commit)
- **Linter**: ESLint with @typescript-eslint
- **Naming**: camelCase for variables/functions, PascalCase for classes/components

## Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes following the code style
3. Write/update tests: `yarn test`
4. Type check: `yarn type-check`
5. Lint: `yarn lint`
6. Commit with co-authored trailer (see below)
7. Push and create a pull request

## Commit Messages

Use conventional commits:
```
feat: Add X feature
fix: Fix Y bug
docs: Update Z documentation
test: Add tests for W
refactor: Improve code structure
perf: Optimize performance
```

Always include co-authored trailer:
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

## Testing

- Unit tests: `yarn workspace <package> test`
- Integration tests: `yarn test --integration`
- Coverage: `yarn test --coverage`

Aim for >80% code coverage on new features.

## Pull Request Process

1. Ensure all checks pass (tests, lint, type-check)
2. Update relevant documentation
3. Request review from maintainers
4. Address feedback
5. Merge after approval

## Architecture Guidelines

- Keep packages modular and focused
- Use dependency injection for testability
- Document complex algorithms
- Follow SOLID principles
- Minimize cross-package dependencies

## Performance Considerations

- Profile before optimizing
- GPU operations on native layers
- Avoid blocking main thread (React Native)
- Monitor memory usage
- Test on low-end devices

## Questions?

Open a discussion in the repository or reach out to the team.
