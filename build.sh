#!/bin/sh
set -e
echo "Building frontend..."
npx vite build --mode production 2>&1
# Vite only bundles index.html, so the standalone dashboard has to be copied
# into dist by hand — otherwise /lazy-cloud.html falls back to index.html in
# production and the "Control room" link opens the regular app.
cp lazy-cloud.html dist/
echo "Frontend built successfully!"
echo "Building server..."
npx esbuild server/production.ts server/db.ts server/api.ts server/s3.ts server/encryption.ts server/plugin.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist-server \
  --external:@neondatabase/serverless \
  --external:@aws-sdk/client-s3 \
  --external:@aws-sdk/lib-storage \
  --external:@aws-sdk/s3-request-presigner \
  --external:busboy \
  --external:@simplewebauthn/server \
  --external:otplib \
  --external:qrcode \
  2>&1
echo "Bundling API handler for Vercel..."
npx esbuild server/api.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile=dist-server/api-handler.js \
  --external:@neondatabase/serverless \
  --external:@aws-sdk/client-s3 \
  --external:@aws-sdk/lib-storage \
  --external:@aws-sdk/s3-request-presigner \
  --external:busboy \
  --external:@simplewebauthn/server \
  --external:otplib \
  --external:qrcode \
  2>&1
echo "Build complete!"
