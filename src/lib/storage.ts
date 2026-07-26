import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createS3Client(): S3Client {
  const region = process.env.S3_REGION ?? "us-east-1";
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  return new S3Client({
    region,
    ...(endpoint
      ? {
          endpoint,
          forcePathStyle: true,
        }
      : {}),
    ...(accessKeyId && secretAccessKey
      ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }
      : {}),
  });
}

let s3: S3Client | null = null;

function getS3(): S3Client {
  if (!s3) s3 = createS3Client();
  return s3;
}

export type PutObjectInput = {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
};

/**
 * Upload an object to S3 (or MinIO when S3_ENDPOINT is set).
 * Returns the public URL for the object.
 */
export async function putObject(input: PutObjectInput): Promise<string> {
  const bucket = requiredEnv("S3_BUCKET");

  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return getPublicUrl(input.key);
}

/**
 * Build the publicly reachable URL for an object key.
 * Uses S3_PUBLIC_BASE_URL (CloudFront or MinIO path-style base).
 */
export function getPublicUrl(key: string): string {
  const base = requiredEnv("S3_PUBLIC_BASE_URL").replace(/\/$/, "");
  const normalizedKey = key.replace(/^\//, "");
  return `${base}/${normalizedKey}`;
}

/**
 * Delete an object by key. No-op-safe for missing keys at the call site;
 * S3 delete is idempotent.
 */
export async function deleteObject(key: string): Promise<void> {
  const bucket = requiredEnv("S3_BUCKET");

  await getS3().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Fetch object bytes (used by the Phase 0 storage smoke test).
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const bucket = requiredEnv("S3_BUCKET");

  const result = await getS3().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!result.Body) {
    throw new Error(`Empty body for key: ${key}`);
  }

  const bytes = await result.Body.transformToByteArray();
  return Buffer.from(bytes);
}
