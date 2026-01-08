'use server'

import { minioClient, bucketName } from '../lib/minio'

export async function getPresignedUrl(filename: string) {
    try {
        const exists = await minioClient.bucketExists(bucketName)
        if (!exists) {
            await minioClient.makeBucket(bucketName, 'us-east-1')

            // Optional: Set policy to public read if creating for first time
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${bucketName}/*`],
                    },
                ],
            }
            await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
        }

        // Presigned PUT URL (valid for 15 mins)
        // Note: minioClient uses the internal endpoint to sign, so the result might have 127.0.0.1
        const rawPresignedUrl = await minioClient.presignedPutObject(bucketName, filename, 15 * 60)

        // Ensure the returned URL uses the PUBLIC domain
        const publicHost = new URL(process.env.NEXT_PUBLIC_MINIO_URL!).hostname
        const presignedUrl = rawPresignedUrl
            .replace('127.0.0.1', publicHost)
            .replace('localhost', publicHost)
            .replace(process.env.MINIO_INTERNAL_ENDPOINT || '127.0.0.1', publicHost)

        // Public URL for storing in DB
        const publicUrl = `${process.env.NEXT_PUBLIC_MINIO_URL}/${filename}`

        return { presignedUrl, publicUrl }
    } catch (error: any) {
        console.error('MinIO Error:', error)
        // Return error to client instead of crashing
        return { error: error.message || 'Falha ao conectar no Storage' }
    }
}
