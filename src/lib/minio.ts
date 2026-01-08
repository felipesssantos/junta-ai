import * as Minio from 'minio'

// Use Internal Endpoint (for backend connection) if available, otherwise fallback to Public
const endPoint = process.env.MINIO_INTERNAL_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost'

export const minioClient = new Minio.Client({
    endPoint,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
})

export const bucketName = process.env.MINIO_BUCKET_NAME || 'junta-ai-files'
