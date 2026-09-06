import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sql from '../db.js';
import { generatePresignedDownloadUrl, generatePresignedUploadUrl, generateS3Key, parseStorageProvider } from '../s3.js';

const router = Router();

// Helper to get available storage provider
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

  if (providers.length > 0) {
    return parseStorageProvider(providers[0]);
  }

  return null;
}

async function updateProviderUsage(providerId: string, fileSizeBytes: number) {
  await sql`
    UPDATE storage_providers
    SET current_bytes = current_bytes + ${fileSizeBytes}
    WHERE id = ${providerId}
  `;
}

// Public upload initiation (no auth required)
router.post('/upload/init', async (req: Request, res: Response) => {
  try {
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
    console.error('Public upload init error:', error);
    res.status(500).json({ error: 'Failed to initialize upload' });
  }
});

// Get file by download token (public - no auth required)
router.get('/file/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const fileResult = await sql`
      SELECT * FROM files WHERE download_token = ${token}
    `;

    if (fileResult.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult[0];

    // Get provider info
    const providerResult = await sql`
      SELECT * FROM storage_providers WHERE id = ${file.storage_provider_id}
    `;

    if (providerResult.length === 0) {
      return res.status(500).json({ error: 'Storage provider not found' });
    }

    const provider = parseStorageProvider(providerResult[0]);

    // Generate presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(provider, file.s3_key);

    res.json({
      id: file.id,
      original_name: file.original_name,
      file_size_bytes: Number(file.file_size_bytes),
      mime_type: file.mime_type,
      created_at: file.created_at,
      download_url: downloadUrl,
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Download file directly (redirects to presigned URL)
router.get('/d/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const fileResult = await sql`
      SELECT * FROM files WHERE download_token = ${token}
    `;

    if (fileResult.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult[0];

    // Get provider info
    const providerResult = await sql`
      SELECT * FROM storage_providers WHERE id = ${file.storage_provider_id}
    `;

    if (providerResult.length === 0) {
      return res.status(500).json({ error: 'Storage provider not found' });
    }

    const provider = parseStorageProvider(providerResult[0]);

    // Generate presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(provider, file.s3_key);

    // Redirect to the presigned URL
    res.redirect(downloadUrl);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
