# LazyDrop 🚀

Fast, private, **link-only file sharing** with a sci-fi UI. Upload once, share a link — no browsing, no searching, no noise.

Files are pooled across multiple S3-compatible storage buckets (Backblaze B2, Cloudflare R2, AWS S3, Google Cloud Storage, IDrive e2, MinIO, or any custom S3 endpoint) for effectively unlimited capacity. Direct-to-bucket uploads and presigned download links mean your server never becomes a bottleneck.

## Features

- **Link-only sharing** — files are only accessible through their unique, unguessable ID. No public directory.
- **Multi-bucket storage pool** — connect unlimited S3-compatible providers; files are routed to the bucket with the most free space.
- **Presigned links** — files stream directly from the edge for uploads and downloads.
- **Sci-fi admin panel** — dashboard stats, storage pool management, user roles, security, and advanced settings.
- **6 themes** — Void Black, Midnight, Light, Monochrome, Purple Haze, and Neon Glow.
- **Advanced options** — max file size, allowed MIME types, auto-delete of old files, download counter, public uploads, per-bucket storage limits.
- **Rocket transfer animation** — because why not.

## Getting started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) Postgres database (or any Postgres-compatible endpoint)
- At least one S3-compatible storage bucket (see **Storage providers** below)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (`.env`):

   ```env
   DATABASE_URL=postgresql://user:password@host/db
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-strong-password
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`, go to **Admin** → **Storage**, and connect a bucket.

### Storage providers

LazyDrop works with any S3-compatible endpoint. Free tiers included:

| Provider | Free tier |
| --- | --- |
| Backblaze B2 | 10 GB free |
| Cloudflare R2 | 10 GB free, zero egress fees |
| AWS S3 | 5 GB for 12 months |
| Google Cloud Storage | 5 GB always-free |
| IDrive e2 | 10 GB free |
| MinIO | Unlimited (self-hosted) |

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server (API included via plugin) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type-check the frontend and server |
| `npm run lint` | Lint all source files |

## Architecture

- **Frontend** — React 18 + TypeScript + Tailwind, lazy-loaded pages, CSS-keyframe animations (no heavy canvas).
- **Backend** — a Vite dev-server plugin (`server/plugin.ts`) exposing a REST API under `/api/`.
- **Database** — Neon serverless Postgres (`server/db.ts`) for file records, storage providers, and admin settings.
- **Storage** — `@aws-sdk/client-s3` for uploads, deletes, and presigned download URLs.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding conventions, and how to submit a PR.