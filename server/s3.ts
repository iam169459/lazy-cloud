import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider } from './db';

function extractRegion(endpointUrl: string): string {
  const url = endpointUrl.toLowerCase();

  const backblazeMatch = url.match(/s3\.([^.]+)\.backblazeb2\.com/);
  if (backblazeMatch) return backblazeMatch[1];

  const awsMatch = url.match(/s3\.([^.]+)\.amazonaws\.com/);
  if (awsMatch) return awsMatch[1];

  const doMatch = url.match(/([^.]+)\.digitaloceanspaces\.com/);
  if (doMatch) return doMatch[1];

  const gcpMatch = url.match(/storage\.googleapis\.com/);
  if (gcpMatch) return 'auto';

  const wasabiMatch = url.match(/s3\.([^.]+)\.wasabisys\.com/);
  if (wasabiMatch) return wasabiMatch[1];

  return 'auto';
}

export function createS3Client(provider: StorageProvider): S3Client {
  return new S3Client({
    region: extractRegion(provider.endpoint_url),
    endpoint: provider.endpoint_url,
    credentials: {
      accessKeyId: provider.access_key_id,
      secretAccessKey: provider.secret_access_key,
    },
    forcePathStyle: true,
  });
}

export async function uploadToProvider(
  provider: StorageProvider,
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const client = createS3Client(provider);
  await client.send(
    new PutObjectCommand({
      Bucket: provider.bucket_name,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteFromProvider(
  provider: StorageProvider,
  key: string
): Promise<void> {
  const client = createS3Client(provider);
  await client.send(
    new DeleteObjectCommand({
      Bucket: provider.bucket_name,
      Key: key,
    })
  );
}

export async function downloadFromProvider(
  provider: StorageProvider,
  key: string
): Promise<Buffer | null> {
  const client = createS3Client(provider);
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: provider.bucket_name,
        Key: key,
      })
    );
    const body = response.Body;
    if (!body) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

export async function getPresignedDownloadUrl(
  provider: StorageProvider,
  key: string,
  filename: string,
  contentType: string
): Promise<string> {
  const client = createS3Client(provider);
  const command = new GetObjectCommand({
    Bucket: provider.bucket_name,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    ResponseContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}
