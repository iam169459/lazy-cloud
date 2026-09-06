import { Router, Request, Response } from 'express';
import sql from '../db.js';
import { generatePresignedDownloadUrl, parseStorageProvider } from '../s3.js';

const router = Router();

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
