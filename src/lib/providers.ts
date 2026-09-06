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
    freeTier: '10 GB free',
    maxStorage: '10 GB free, no egress fees',
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
    maxStorage: '5 GB free tier, then $0.023/GB/mo',
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
    maxStorage: '5 GB free, then $0.020/GB/mo',
    protocol: 'XML API (S3 Compatible)',
    signupUrl: 'https://console.cloud.google.com/freetrial',
    docsUrl: 'https://cloud.google.com/storage/docs',
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean Spaces',
    icon: '🔵',
    color: '#0080ff',
    endpoint: 'https://{region}.digitaloceanspaces.com',
    regionPlaceholder: 'nyc3',
    freeTier: '250 GB (30-day trial)',
    maxStorage: '250 GB included, then $5/mo',
    protocol: 'S3 Compatible',
    signupUrl: 'https://www.digitalocean.com/start',
    docsUrl: 'https://docs.digitalocean.com/products/spaces/',
  },
  {
    id: 'wasabi',
    name: 'Wasabi',
    icon: '🟣',
    color: '#6d31db',
    endpoint: 'https://s3.{region}.wasabisys.com',
    regionPlaceholder: 'us-east-1',
    freeTier: '1 TB free (30 days)',
    maxStorage: '1 TB free trial, then $5.99/mo',
    protocol: 'S3 Compatible',
    signupUrl: 'https://wasabi.com/signup/',
    docsUrl: 'https://docs.wasabi.com/',
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
    maxStorage: 'Your own storage',
    protocol: 'S3 Compatible',
    signupUrl: 'https://min.io/download',
    docsUrl: 'https://min.io/docs/minio/linux/index.html',
  },
  {
    id: 'linode',
    name: 'Linode / Akamai',
    icon: '🟢',
    color: '#00b050',
    endpoint: 'https://{region}.linodeobjects.com',
    regionPlaceholder: 'us-east-1',
    freeTier: '5 GB (60-day trial)',
    maxStorage: '5 GB trial, then $5/mo',
    protocol: 'S3 Compatible',
    signupUrl: 'https://www.linode.com/signup',
    docsUrl: 'https://www.linode.com/docs/products/storage/object-storage/',
  },
  {
    id: 'hetzner',
    name: 'Hetzner Cloud Storage',
    icon: '🔴',
    color: '#d50c2d',
    endpoint: 'https://{region}.your-objectstorage.com',
    regionPlaceholder: 'fsn1',
    freeTier: '5 GB free (trial)',
    maxStorage: '5 GB trial, then €4.99/mo',
    protocol: 'S3 Compatible',
    signupUrl: 'https://accounts.hetzner.com/signup',
    docsUrl: 'https://docs.hetzner.com/cloud/storage-box/',
  },
];

export function getProviderById(id: string): CloudProvider | undefined {
  return cloudProviders.find(p => p.id === id);
}

export function getProviderColors(id: string): string {
  return getProviderById(id)?.color || '#6b7280';
}
