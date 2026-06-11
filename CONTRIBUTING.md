# Contributing

This is a small solo project, but issues and pull requests are welcome.

## Setup

```bash
npm ci
npm run dev
```

## Before opening a PR

Run the same checks CI runs:

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run test:e2e   # requires Playwright browsers: npx playwright install chromium
```

Keep changes focused — one fix or feature per PR. If you're planning something
larger, open an issue first so we can talk it through.
