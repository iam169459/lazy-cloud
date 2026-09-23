#!/bin/sh
set -e
echo "Building frontend..."
npx vite build --mode production 2>&1
echo "Frontend built successfully!"
echo "Building server..."
npx esbuild server/production.ts server/db.ts server/api.ts server/s3.ts server/encryption.ts server/plugin.ts --bundle --platform=node --format=esm --outdir=dist-server --external:@neondatabase/serverless --external:@aws-sdk/client-s3 --external:@aws-sdk/lib-storage --external:@aws-sdk/s3-request-presigner --external:busboy 2>&1
echo "Build complete!"
