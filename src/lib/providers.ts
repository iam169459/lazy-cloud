export interface CloudProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  endpoint: string;
  regionPlaceholder: string;
  freeTier: string;
  maxStorage: string;
  protocol: string;
  signupUrl: string;
  docsUrl: string;
}

export const cloudProviders: CloudProvider[] = [
  {
    id: 'backblaze-b2',
    name: 'Backblaze B2',
    icon: '🔷',
    color: '#3882ff',
    endpoint: 'https://s3.{region}.backblazeb2.com',
    regionPlaceholder: 'us-west-005',
    freeTier: '10 GB free',
    maxStorage: '10 GB free, then $0.005/GB/mo',
    protocol: 'S3 Compatible',
    signupUrl: 'https://secure.backblaze.com/signup',
    docsUrl: 'https://help.backblaze.com/hc/en-us/articles/1260803698569',
  },
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    icon: '🟠',
    color: '#f6821f',
    endpoint: 'https://{account_id}.r2.cloudflarestorage.com',
    regionPlaceholder: 'auto',
    freeTier: '10 GB free, no egress',
    maxStorage: '10 GB free, zero egress fees',
    protocol: 'S3 Compatible',
    signupUrl: 'https://dash.cloudflare.com/sign-up',
    docsUrl: 'https://developers.cloudflare.com/r2/',
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    icon: '🟡',
    color: '#ff9900',
    endpoint: 'https://s3.{region}.amazonaws.com',
    regionPlaceholder: 'us-east-1',
    freeTier: '5 GB free (12 months)',
    maxStorage: '5 GB free tier for 12 months',
    protocol: 'S3 Native',
    signupUrl: 'https://portal.aws.amazon.com/billing/signup',
    docsUrl: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud Storage',
    icon: '🔴',
    color: '#4285f4',
    endpoint: 'https://storage.googleapis.com',
    regionPlaceholder: 'auto',
    freeTier: '5 GB free',
    maxStorage: '5 GB always-free, then $0.020/GB/mo',
    protocol: 'XML API (S3 Compatible)',
    signupUrl: 'https://console.cloud.google.com/freetrial',
    docsUrl: 'https://cloud.google.com/storage/docs',
  },
  {
    id: 'idrive-e2',
    name: 'IDrive e2',
    icon: '🟢',
    color: '#00b050',
    endpoint: 'https://s3.{region}.idrive.com',
    regionPlaceholder: 'us-east-1',
    freeTier: '10 GB free',
    maxStorage: '10 GB free, then $0.005/GB/mo',
    protocol: 'S3 Compatible',
    signupUrl: 'https://www.idrive.com/e2/signup',
    docsUrl: 'https://www.idrive.com/e2/help',
  },
  {
    id: 'minio',
    name: 'MinIO (Self-hosted)',
    icon: '⚪',
    color: '#c72c48',
    endpoint: 'http://{your-server}:9000',
    regionPlaceholder: 'us-east-1',
    freeTier: 'Unlimited (self-hosted)',
    maxStorage: 'Your own storage — completely free',
    protocol: 'S3 Compatible',
    signupUrl: 'https://min.io/download',
    docsUrl: 'https://min.io/docs/minio/linux/index.html',
  },
];

export function getProviderById(id: string): CloudProvider | undefined {
  return cloudProviders.find(p => p.id === id);
}

export function detectProviderFromEndpoint(endpoint: string): CloudProvider | undefined {
  const url = endpoint.toLowerCase();
  if (url.includes('backblazeb2.com')) return cloudProviders.find(p => p.id === 'backblaze-b2');
  if (url.includes('r2.cloudflarestorage.com')) return cloudProviders.find(p => p.id === 'cloudflare-r2');
  if (url.includes('amazonaws.com')) return cloudProviders.find(p => p.id === 'aws-s3');
  if (url.includes('storage.googleapis.com')) return cloudProviders.find(p => p.id === 'google-cloud');
  if (url.includes('idrive.com')) return cloudProviders.find(p => p.id === 'idrive-e2');
  if (url.includes(':9000') && !url.includes('amazonaws.com')) return cloudProviders.find(p => p.id === 'minio');
  return undefined;
}
