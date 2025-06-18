import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.FILES_REGION,
  credentials: {
    accessKeyId: process.env.FILES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.FILES_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.FILES_BUCKET!

export async function getPresignedUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return await getSignedUrl(s3, command, { expiresIn: 3600 })
}
