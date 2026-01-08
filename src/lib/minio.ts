import * as Minio from 'minio'

// 1. Client for Backend Operations (Admin)
// Connects locally (127.0.0.1) to bypass NAT/Firewall
const internalEndPoint = process.env.MINIO_INTERNAL_ENDPOINT || 'localhost'
export const minioClient = new Minio.Client({
    endPoint: internalEndPoint,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
})

// 2. Client for Signing URLs (Public)
// Configured with Public IP so signatures match the Browser's 'Host' header
// It does NOT make requests, only calculates hashes (Offline)
const publicEndPoint = process.env.MINIO_ENDPOINT || 'localhost'
export const minioSigner = new Minio.Client({
    endPoint: publicEndPoint,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
})

export const bucketName = process.env.MINIO_BUCKET_NAME || 'junta-ai-files'
