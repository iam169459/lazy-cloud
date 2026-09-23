import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider } from './db';

const regionCache = new Map<string, string>();

function guessRegionFromEndpoint(endpointUrl: string): string {
  const url = endpointUrl.toLowerCase();

  const backblazeMatch = url.match(/s3\.([^.]+)\.backblazeb2\.com/);
  if (backblazeMatch) return backblazeMatch[1];

  const awsMatch = url.match(/s3\.([^.]+)\.amazonaws\.com/);
  if (awsMatch) return awsMatch[1];

  const doMatch = url.match(/([^.]+)\.digitaloceanspaces\.com/);
  if (doMatch) return doMatch[1];

  const wasabiMatch = url.match(/s3\.([^.]+)\.wasabisys\.com/);
  if (wasabiMatch) return wasabiMatch[1];

  return '';
}

async function detectRegion(provider: StorageProvider): Promise<string> {
  const cacheKey = `${provider.id}-${provider.endpoint_url}`;
  if (regionCache.has(cacheKey)) return regionCache.get(cacheKey)!;

  if (provider.region && provider.region !== 'auto') {
    regionCache.set(cacheKey, provider.region);
    return provider.region;
  }

  const guessed = guessRegionFromEndpoint(provider.endpoint_url);
  if (guessed) {
    regionCache.set(cacheKey, guessed);
    return guessed;
  }

  const probeClient = new S3Client({
    region: 'us-east-1',
    endpoint: provider.endpoint_url,
    credentials: {
      accessKeyId: provider.access_key_id,
      secretAccessKey: provider.secret_access_key,
    },
    forcePathStyle: true,
  });

  try {
    const res = await probeClient.send(new GetBucketLocationCommand({ Bucket: provider.bucket_name }));
    const loc = res.LocationConstraint || 'us-east-1';
    regionCache.set(cacheKey, loc);
    return loc;
  } catch {
    regionCache.set(cacheKey, 'us-east-1');
    return 'us-east-1';
  }
}

export async function createS3Client(provider: StorageProvider): Promise<S3Client> {
  const region = await detectRegion(provider);
  return new S3Client({
    region,
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
  body: Buffer | NodeJS.ReadableStream,
  contentType: string
): Promise<void> {
  const client = await createS3Client(provider);

  const upload = new Upload({
    client,
    params: {
      Bucket: provider.bucket_name,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
    queueSize: 4,
    partSize: 10 * 1024 * 1024,
    leavePartsOnError: false,
  });

  await upload.done();
}

export async function deleteFromProvider(
  provider: StorageProvider,
  key: string
): Promise<void> {
  const client = await createS3Client(provider);
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
  const client = await createS3Client(provider);
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: provider.bucket_name,
        Key: key,
      })
    );
    const body = response.Body;
    if (!body) return null;
    const chunks: Uint8Array[] = [];
    const stream = body.transformToWebStream();
    const reader = stream.getReader();
    let result = await reader.read();
    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }
    return Buffer.concat(chunks.map(c => Buffer.from(c)));
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
  const client = await createS3Client(provider);
  const command = new GetObjectCommand({
    Bucket: provider.bucket_name,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    ResponseContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
}

export async function listObjects(
  provider: StorageProvider
): Promise<S3Object[]> {
  const client = await createS3Client(provider);
  const objects: S3Object[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: provider.bucket_name,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          objects.push({
            key: obj.Key,
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
          });
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

export function clearRegionCache(providerId?: string) {
  if (providerId) {
    for (const key of regionCache.keys()) {
      if (key.startsWith(providerId)) regionCache.delete(key);
    }
  } else {
    regionCache.clear();
  }
}

export async function getBucketSize(provider: StorageProvider): Promise<{ usedBytes: number; objectCount: number }> {
  const client = await createS3Client(provider);
  let usedBytes = 0;
  let objectCount = 0;
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: provider.bucket_name,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents) {
      for (const obj of response.Contents) {
        usedBytes += obj.Size || 0;
        objectCount++;
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return { usedBytes, objectCount };
}
