import { neon } from '@neondatabase/serverless';

declare global {
  // eslint-disable-next-line no-var
  var neonConfig: any;
}

// Configure Neon to use WebSocket
if (!global.neonConfig) {
  global.neonConfig = {};
}

import { WebSocket as WSWebSocket } from 'ws';

global.neonConfig.webSocketConstructor = WSWebSocket;

const sql = neon(process.env.DATABASE_URL || '');

export async function initDatabase() {
  console.log('Initializing database...');

  // Create admin_settings table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) DEFAULT 'admin',
      password VARCHAR(255) DEFAULT 'lazydrop-admin-2024',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create storage_providers table
  await sql`
    CREATE TABLE IF NOT EXISTS storage_providers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider_name VARCHAR(255) NOT NULL,
      endpoint_url TEXT NOT NULL,
      bucket_name VARCHAR(255) NOT NULL,
      access_key_id TEXT NOT NULL,
      secret_access_key TEXT NOT NULL,
      max_bytes BIGINT DEFAULT 10188208025,
      current_bytes BIGINT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create files table
  await sql`
    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_name VARCHAR(255) NOT NULL,
      storage_provider_id UUID REFERENCES storage_providers(id) ON DELETE CASCADE,
      s3_key TEXT NOT NULL,
      file_size_bytes BIGINT NOT NULL,
      mime_type VARCHAR(255),
      download_token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default admin if table is empty
  const adminCount = await sql`SELECT COUNT(*) as count FROM admin_settings`;
  if (adminCount[0].count === 0) {
    await sql`
      INSERT INTO admin_settings (username, password)
      VALUES ('admin', 'lazydrop-admin-2024')
    `;
    console.log('Inserted default admin user');
  }

  console.log('Database initialization complete');
}

export default sql;
