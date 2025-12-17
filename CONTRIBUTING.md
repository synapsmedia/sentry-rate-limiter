# Contributing

## Commit Message Format

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and package publishing. Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>
```

### Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Breaking Changes

To trigger a major version bump, add `BREAKING CHANGE:` in the commit body or footer:

```
feat: change API signature

BREAKING CHANGE: The `shouldReport` method now requires an additional parameter
```

Or use `!` after the type:

```
feat!: change API signature
```

### Examples

```bash
# Patch release (1.0.0 -> 1.0.1)
git commit -m "fix: correct fingerprint calculation for errors without stack traces"

# Minor release (1.0.0 -> 1.1.0)
git commit -m "feat: add getStats method to monitor rate limiting"

# Major release (1.0.0 -> 2.0.0)
git commit -m "feat!: change constructor options interface"
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes
4. Build: `npm run build`
5. Commit using conventional commits
6. Push to your fork and create a pull request

## Release Process

Releases are automated via GitHub Actions:

1. Push commits to `main` branch
2. GitHub Actions runs the release workflow
3. semantic-release analyzes commits and determines version bump
4. New version is published to npm automatically
5. GitHub release is created with changelog

No manual version bumping or publishing needed!
