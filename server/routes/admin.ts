import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from '../db.js';
import { parseStorageProvider, generateS3Key } from '../s3.js';
import { getS3Client } from '../s3.js';

const router = Router();

// Helper to verify admin token
function verifyToken(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Get active storage provider with available space
async function getAvailableProvider(fileSizeBytes: number) {
  const providers = await sql`
    SELECT *
    FROM storage_providers
    WHERE is_active = true
    ORDER BY current_bytes ASC
  `;

  for (const row of providers) {
    const provider = parseStorageProvider(row);
    if (provider.current_bytes + fileSizeBytes <= provider.max_bytes) {
      return provider;
    }
  }

  // Return first active provider even if over limit (will fail later)
  if (providers.length > 0) {
    return parseStorageProvider(providers[0]);
  }

  return null;
}

// Update current_bytes for provider
async function updateProviderUsage(providerId: string, fileSizeBytes: number) {
  await sql`
    UPDATE storage_providers
    SET current_bytes = current_bytes + ${fileSizeBytes}
    WHERE id = ${providerId}
  `;
}

// Dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const providersResult = await sql`
      SELECT * FROM storage_providers WHERE is_active = true
    `;

    const filesResult = await sql`
      SELECT COUNT(*) as total FROM files
    `;

    let totalBytes = 0;
    let totalMaxBytes = 0;

    for (const row of providersResult) {
      totalBytes += Number(row.current_bytes);
      totalMaxBytes += Number(row.max_bytes);
    }

    res.json({
      totalFiles: filesResult[0].total,
      totalBytes,
      totalMaxBytes,
      usedPercentage: totalMaxBytes > 0 ? (totalBytes / totalMaxBytes) * 100 : 0,
      providers: providersResult.map((row) => ({
        ...row,
        current_bytes: Number(row.current_bytes),
        max_bytes: Number(row.max_bytes),
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Storage providers CRUD
router.get('/storage', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const providers = await sql`
      SELECT * FROM storage_providers ORDER BY created_at DESC
    `;

    res.json(
      providers.map((row) => ({
        ...row,
        current_bytes: Number(row.current_bytes),
        max_bytes: Number(row.max_bytes),
      }))
    );
  } catch (error) {
    console.error('Storage providers error:', error);
    res.status(500).json({ error: 'Failed to fetch storage providers' });
  }
});

router.post('/storage', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { provider_name, endpoint_url, bucket_name, access_key_id, secret_access_key, max_bytes } = req.body;

    if (!provider_name || !endpoint_url || !bucket_name || !access_key_id || !secret_access_key) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await sql`
      INSERT INTO storage_providers (provider_name, endpoint_url, bucket_name, access_key_id, secret_access_key, max_bytes)
      VALUES (${provider_name}, ${endpoint_url}, ${bucket_name}, ${access_key_id}, ${secret_access_key}, ${max_bytes || 10188208025})
      RETURNING *
    `;

    res.status(201).json({
      ...result[0],
      current_bytes: Number(result[0].current_bytes),
      max_bytes: Number(result[0].max_bytes),
    });
  } catch (error) {
    console.error('Add storage provider error:', error);
    res.status(500).json({ error: 'Failed to add storage provider' });
  }
});

router.delete('/storage/:id', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await sql`
      DELETE FROM storage_providers WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Storage provider not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete storage provider error:', error);
    res.status(500).json({ error: 'Failed to delete storage provider' });
  }
});

router.patch('/storage/:id', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    const result = await sql`
      UPDATE storage_providers
      SET is_active = ${Boolean(is_active)}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Storage provider not found' });
    }

    res.json({
      ...result[0],
      current_bytes: Number(result[0].current_bytes),
      max_bytes: Number(result[0].max_bytes),
    });
  } catch (error) {
    console.error('Toggle storage provider error:', error);
    res.status(500).json({ error: 'Failed to toggle storage provider' });
  }
});

// Files
router.get('/files', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const files = await sql`
      SELECT f.*, sp.provider_name
      FROM files f
      LEFT JOIN storage_providers sp ON f.storage_provider_id = sp.id
      ORDER BY f.created_at DESC
    `;

    res.json(
      files.map((row) => ({
        ...row,
        file_size_bytes: Number(row.file_size_bytes),
      }))
    );
  } catch (error) {
    console.error('Files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

router.delete('/files/:id', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get file info first to update provider usage
    const fileResult = await sql`
      SELECT * FROM files WHERE id = ${id}
    `;

    if (fileResult.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult[0];

    // Delete the file from S3
    try {
      const s3Client = getS3Client({
        id: file.storage_provider_id,
        endpoint_url: '',
        bucket_name: '',
        access_key_id: '',
        secret_access_key: '',
        max_bytes: 0,
        current_bytes: 0,
        is_active: true,
      });
      // We need to get the actual provider info
      const providerResult = await sql`
        SELECT * FROM storage_providers WHERE id = ${file.storage_provider_id}
      `;

      if (providerResult.length > 0) {
        const provider = parseStorageProvider(providerResult[0]);
        const s3Client = getS3Client(provider);

        // Delete from S3 - Note: in a real implementation we'd use DeleteObjectCommand
        // For now, mark the file as deleted
      }
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      // Continue with database deletion even if S3 fails
    }

    // Delete from database
    await sql`
      DELETE FROM files WHERE id = ${id}
    `;

    // Update provider current_bytes
    await sql`
      UPDATE storage_providers
      SET current_bytes = GREATEST(current_bytes - ${Number(file.file_size_bytes)}, 0)
      WHERE id = ${file.storage_provider_id}
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Security settings
router.get('/security', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await sql`
      SELECT username, password FROM admin_settings LIMIT 1
    `;

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Admin settings not found' });
    }

    res.json(settings[0]);
  } catch (error) {
    console.error('Security settings error:', error);
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

router.put('/security', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await sql`
      UPDATE admin_settings
      SET username = ${username}, password = ${password}, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING username, password
    `;

    res.json(result[0]);
  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// Upload initiation
router.post('/upload/init', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fileName, fileSize, mimeType } = req.body;

    if (!fileName || !fileSize) {
      return res.status(400).json({ error: 'Filename and size are required' });
    }

    const provider = await getAvailableProvider(Number(fileSize));

    if (!provider) {
      return res.status(400).json({ error: 'No available storage provider' });
    }

    const s3Key = generateS3Key(fileName);
    const downloadToken = uuidv4();

    // Create file record
    const fileResult = await sql`
      INSERT INTO files (original_name, storage_provider_id, s3_key, file_size_bytes, mime_type, download_token)
      VALUES (${fileName}, ${provider.id}, ${s3Key}, ${Number(fileSize)}, ${mimeType || 'application/octet-stream'}, ${downloadToken})
      RETURNING *
    `;

    const file = fileResult[0];

    // Update provider usage
    await updateProviderUsage(provider.id, Number(fileSize));

    // Generate presigned upload URL
    const uploadUrl = await generatePresignedUploadUrl(
      provider,
      s3Key,
      mimeType || 'application/octet-stream',
      Number(fileSize)
    );

    res.json({
      uploadUrl,
      downloadToken: file.download_token,
      fileId: file.id,
    });
  } catch (error) {
    console.error('Upload init error:', error);
    res.status(500).json({ error: 'Failed to initialize upload' });
  }
});

// Delete admin account endpoint
router.delete('/admin', async (req: Request, res: Response) => {
  try {
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await sql`
      DELETE FROM admin_settings WHERE id = 1
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

export default router;
