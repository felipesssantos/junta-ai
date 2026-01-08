'use server'

import { minioClient, minioSigner, bucketName } from '../lib/minio'

export async function getPresignedUrl(filename: string) {
    try {
        // Admin Ops: Use Internal Client (Connectivity Check)
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

        // Signing Ops: Use Public Client (Correct Host Header Signature)
        const presignedUrl = await minioSigner.presignedPutObject(bucketName, filename, 15 * 60)

        // Public URL for storing in DB
        const publicUrl = `${process.env.NEXT_PUBLIC_MINIO_URL}/${filename}`

        return { presignedUrl, publicUrl }
    } catch (error: any) {
        console.error('MinIO Error:', error)
        // Return error to client instead of crashing
        return { error: error.message || 'Falha ao conectar no Storage' }
    }
}
