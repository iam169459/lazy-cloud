# LazyDrop

Fast, private, **link-only file sharing** with a sci-fi UI. Upload once, share a link — no browsing, no searching, no noise.

Files are pooled across multiple S3-compatible storage buckets (Backblaze B2, Cloudflare R2, AWS S3, Google Cloud Storage, IDrive e2, MinIO, or any custom S3 endpoint) for effectively unlimited capacity. Direct-to-bucket uploads and presigned download links mean your server never becomes a bottleneck.

## Quick Start (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/iam169459/lazy-cloud/dev/setup.sh | bash
```

This auto-installs everything: Node.js, npm, dependencies, builds the project, and starts the server.

## Features

- **Link-only sharing** — files are only accessible through their unique, unguessable ID. No public directory.
- **Multi-bucket storage pool** — connect unlimited S3-compatible providers; files are routed to the bucket with the most free space.
- **Presigned links** — files stream directly from the edge for uploads and downloads.
- **File sharing** — expiring, password-protected share links with download limits.
- **File preview** — in-browser preview for images, videos, audio, and PDFs.
- **Bulk operations** — multi-select delete and download from the admin dashboard.
- **API keys** — programmatic access with scoped permissions and rotation.
- **Upload queue** — concurrent multi-file uploads with progress tracking.
- **Audit log** — track all admin actions with IP and user agent.
- **Storage analytics** — usage charts, provider breakdown, growth trends.
- **Rate limiting** — per-IP protection on uploads, downloads, and login.
- **Sci-fi admin panel** — dashboard stats, storage pool management, user roles, security, and advanced settings.
- **6 themes** — Void Black, Midnight, Light, Monochrome, Purple Haze, and Neon Glow.
- **Rocket transfer animation** — because why not.

## Manual Setup

### Prerequisites

- Node.js 18+ (the setup script installs this automatically)
- A [Neon](https://neon.tech) Postgres database (or any Postgres-compatible endpoint)
- At least one S3-compatible storage bucket

### Steps

1. Clone and install:
   ```bash
   git clone -b dev https://github.com/iam169459/lazy-cloud.git
   cd lazy-cloud
   npm install
   ```

2. Create `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/db
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-strong-password
   ```

3. Start:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`, go to **Admin** → **Storage**, and connect a bucket.

## Deployment

### Render (Recommended)

1. Push to GitHub
2. Connect repo on [Render](https://render.com)
3. Set environment variables in dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD`
   - `NODE_ENV` = `production`
4. Deploy automatically from `dev` branch

Build command: `npm install && npm run build`
Start command: `npm start`

### Other Platforms

The app works on any Node.js host (Railway, Fly.io, Vercel, etc.). Set the same environment variables and use the build/start commands above.

## Storage Providers

LazyDrop works with any S3-compatible endpoint. Free tiers included:

| Provider | Free tier |
| --- | --- |
| Backblaze B2 | 10 GB free |
| Cloudflare R2 | 10 GB free, zero egress fees |
| AWS S3 | 5 GB for 12 months |
| Google Cloud Storage | 5 GB always-free |
| IDrive e2 | 10 GB free |
| MinIO | Unlimited (self-hosted) |

## Scripts

| Script | Purpose |
| --- | --- |
| `lazydrop install` | Install LazyDrop (auto-installs Node.js if needed) |
| `lazydrop start` | Start the dev server |
| `lazydrop stop` | Stop the server |
| `lazydrop restart` | Restart the server |
| `lazydrop status` | Show status, config, and connection info |
| `lazydrop update` | Pull latest changes and rebuild |
| `lazydrop logs` | Follow live logs |
| `lazydrop service` | Install as systemd service (VPS) |
| `lazydrop uninstall` | Remove LazyDrop completely |
| `npm run dev` | Start dev server directly |
| `npm run build` | Production build |
| `npm start` | Start production server |

## Architecture

- **Frontend** — React 18 + TypeScript + Tailwind, lazy-loaded pages, code-split chunks, CSS animations.
- **Backend** — Express-compatible server (`server/production.ts`) for production, Vite plugin (`server/plugin.ts`) for development.
- **Database** — Neon serverless Postgres (`server/db.ts`) for file records, storage providers, shares, API keys, audit log, and admin settings.
- **Storage** — `@aws-sdk/client-s3` for uploads, deletes, and presigned download URLs.
- **Build** — Vite for frontend, esbuild for server bundle.

## License

MIT
