# Contributing to LazyDrop

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repo:

   ```bash
   git clone git@github.com:your-username/lazy-drop.git
   cd lazy-drop
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

   Required variables:

   ```env
   DATABASE_URL=postgresql://user:password@host/db
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-strong-password
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173` and go to Admin > Storage to connect a bucket.

## Project Structure

```
lazy-drop/
  server/
    api.ts          REST API endpoints
    db.ts           Database schema and queries
    s3.ts           S3 client, uploads, presigned URLs
    plugin.ts       Vite middleware, CORS, rate limiting
  src/
    pages/          React page components (lazy-loaded)
    lib/            Shared utilities (api client, themes, providers, sounds)
    index.css       Global styles and animations
  index.html        Entry point
  vite.config.ts    Vite + server plugin config
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide icons
- **Backend:** Node.js (Vite plugin), Neon serverless Postgres
- **Storage:** `@aws-sdk/client-s3` + `@aws-sdk/lib-storage` for multipart uploads
- **IDs:** `crypto.randomUUID()` — never use `Math.random()` or sequential IDs
- **BIGINT columns:** returned as strings from Postgres — always use `Number()` before math

## Before Submitting a PR

Run all checks:

```bash
npm run typecheck
npm run lint
npm run build
```

All three must pass. No TypeScript errors, no lint warnings, clean production build.

## Coding Conventions

- No comments unless asked
- Prefer editing existing files over creating new ones
- Follow existing code style and patterns
- Use `crypto.randomUUID()` for all new IDs
- Use `sanitize()` for all user input on the server
- BIGINT columns from Postgres come back as strings — wrap with `Number()` before arithmetic
- Never commit secrets or API keys

## How to Contribute

### Bug Reports

Open an issue with:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS info

### Feature Requests

Open an issue describing:

- What you want and why
- How it fits with the project's goals (link-only sharing, multi-bucket storage)

### Code Changes

1. Create a branch from `main`:

   ```bash
   git checkout -b your-feature-name
   ```

2. Make your changes
3. Run `npm run typecheck && npm run lint && npm run build`
4. Commit with a clear message
5. Push and open a PR against `main`

### What to Work On

Check the [issue tracker](https://github.com/iam169459/lazy-cloud/issues) for open issues, or propose something new. Good first contributions:

- UI/UX improvements
- Mobile responsiveness fixes
- New storage provider integrations
- Better error messages
- Test coverage
- Documentation improvements

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
