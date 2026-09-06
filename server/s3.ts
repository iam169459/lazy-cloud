import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

interface StorageProvider {
  id: string;
  provider_name: string;
  endpoint_url: string;
  bucket_name: string;
  access_key_id: string;
  secret_access_key: string;
  max_bytes: number;
  current_bytes: number;
  is_active: boolean;
}

interface S3ClientCache {
  [key: string]: S3Client;
}

const clientCache: S3ClientCache = {};

function extractRegion(endpointUrl: string): string {
  try {
    const url = new URL(endpointUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // For Backblaze B2, region is in the path like s3.us-east-005.backblazeb2.com
    // or similar patterns
    const hostname = url.hostname;
    const match = hostname.match(/s3\.([^\s.]+)\.backblazeb2\.com/i);
    if (match) {
      return match[1];
    }
    // Try to extract from path
    if (pathParts.length > 0) {
      const match2 = pathParts[0].match(/us-east-\d+/);
      if (match2) {
        return match2[0];
      }
    }
  } catch (e) {
    console.error('Error extracting region from endpoint URL:', e);
  }
  return 'us-east-005';
}

export function getS3Client(provider: StorageProvider): S3Client {
  const cacheKey = provider.id;
  if (clientCache[cacheKey]) {
    return clientCache[cacheKey];
  }

  const region = extractRegion(provider.endpoint_url);

  const client = new S3Client({
    region: region,
    endpoint: provider.endpoint_url,
    credentials: {
      accessKeyId: provider.access_key_id,
      secretAccessKey: provider.secret_access_key,
    },
    forcePathStyle: true,
  });

  clientCache[cacheKey] = client;
  return client;
}

export async function generatePresignedUploadUrl(
  provider: StorageProvider,
  s3Key: string,
  contentType: string,
  fileSize: number,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client(provider);

  const command = new PutObjectCommand({
    Bucket: provider.bucket_name,
    Key: s3Key,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

export async function generatePresignedDownloadUrl(
  provider: StorageProvider,
  s3Key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client(provider);

  const command = new GetObjectCommand({
    Bucket: provider.bucket_name,
    Key: s3Key,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

export function generateS3Key(originalName: string): string {
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}/${uniqueId}-${originalName}`;
}

export function parseStorageProvider(row: any): StorageProvider {
  return {
    id: row.id,
    provider_name: row.provider_name,
    endpoint_url: row.endpoint_url,
    bucket_name: row.bucket_name,
    access_key_id: row.access_key_id,
    secret_access_key: row.secret_access_key,
    max_bytes: Number(row.max_bytes),
    current_bytes: Number(row.current_bytes),
    is_active: Boolean(row.is_active),
  };
}
