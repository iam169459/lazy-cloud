# LazyDrop - Secure File Sharing

A secure, scalable file-sharing web application with multi-account storage pooling using Neon PostgreSQL and Backblaze B2 (S3-compatible).

## Features

- **Public Upload Landing Page** - Clean dropzone interface for file uploads with progress tracking
- **Direct Browser Uploads** - Uses presigned URLs for direct browser-to-S3 uploads (no server bottlenecks)
- **Unique Download Links** - Generates unique, non-listable public links (`/d/:token`)
- **Strict Privacy** - No public directory listing or file searching (link-only access)
- **Admin Panel** - Dashboard, Storage management, Files management, Security settings
- **Multi-Account Storage Pooling** - Automatically routes uploads to available storage providers
- **Storage Auto-Routing** - When one provider hits capacity, uploads route to the next available provider

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: Express, TypeScript
- **Database**: Neon PostgreSQL (via `@neondatabase/serverless`)
- **Storage**: Backblaze B2 (S3-compatible via `@aws-sdk/client-s3`)

## Project Structure

```
lazydrop/
├── server/
│   ├── db.ts           # Neon PostgreSQL connection and schema
│   ├── s3.ts           # Backblaze B2 S3 client configuration
│   ├── index.ts        # Express server entry point
│   └── routes/
│       ├── admin.ts    # Admin API routes
│       └── public.ts   # Public API routes
├── frontend/
│   ├── index.html      # HTML entry point
│   └── src/
│       ├── main.tsx    # React entry point
│       ├── App.tsx     # Main app with routing
│       ├── index.css   # Global styles with Tailwind
│       └── pages/
│           ├── UploadLanding.tsx   # Public upload page
│           ├── DownloadPage.tsx    # Public download page
│           ├── AdminLogin.tsx      # Admin login page
│           └── AdminPanel.tsx      # Admin dashboard
├── dist/               # Built frontend assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Neon PostgreSQL connection string
   ```

3. **Build the frontend**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Public upload page: http://localhost:3001/
   - Admin login: http://localhost:3001/admin/login
   - Admin panel: http://localhost:3001/admin

## Default Credentials

- **Username**: `admin`
- **Password**: `lazydrop-admin-2024`

## API Endpoints

### Public Routes

- `GET /api/public/file/:token` - Get file info by download token
- `GET /api/public/d/:token` - Download file (redirects to presigned URL)

### Admin Routes (requires Bearer token)

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/storage` - List storage providers
- `POST /api/admin/storage` - Add storage provider
- `DELETE /api/admin/storage/:id` - Delete storage provider
- `PATCH /api/admin/storage/:id` - Toggle storage provider active status
- `GET /api/admin/files` - List uploaded files
- `DELETE /api/admin/files/:id` - Delete a file
- `GET /api/admin/security` - Get admin credentials
- `PUT /api/admin/security` - Update admin credentials
- `POST /api/admin/upload/init` - Initialize upload (get presigned URL)

## Storage Provider Configuration

When adding a storage provider in the admin panel, you'll need:

| Field | Example | Description |
|-------|---------|-------------|
| Provider Name | My B2 Bucket | Display name |
| Endpoint URL | https://s3.us-east-005.backblazeb2.com | B2 S3 endpoint |
| Bucket Name | my-bucket | Your B2 bucket name |
| Access Key ID | your-key-id | B2 application key ID |
| Secret Access Key | your-secret-key | B2 application key |
| Max Bytes | 10188208025 | ~9.5 GB per provider |

## How It Works

1. **Upload Flow**
   - User selects files on the public upload page
   - Server finds an available storage provider with enough capacity
   - Server generates a presigned S3 upload URL
   - Browser uploads directly to S3 (bypassing server)
   - File record is created in the database with a unique download token

2. **Download Flow**
   - User visits `/d/:token`
   - Server looks up the file by token
   - Server generates a presigned S3 download URL
   - User is redirected to the presigned URL for direct download

3. **Storage Pooling**
   - When a provider reaches its `max_bytes` limit, new uploads route to the next available provider
   - `current_bytes` is updated automatically on each upload/delete

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `PORT` | No | Server port (default: 3001) |
