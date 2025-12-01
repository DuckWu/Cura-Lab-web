// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3' // <--- 1. NEW IMPORT
import { inviteJuror } from './api/invite-juror'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Galleries } from './collections/Galleries'
import { Exhibitions } from './collections/Exhibitions'
import { Artworks } from './collections/Artworks'
import { Submissions } from './collections/Submissions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // CORS: Allow your frontend to talk to your backend
  cors: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL || '', 
    // 👇 直接把报错的这个域名加进去，不要带斜杠
    'https://cura-lab-web-hvtq.vercel.app', 
    'https://cura-lab-web.vercel.app', // 把正式域名也加上
  ].filter(Boolean),

  // 2. 修改 CSRF：也要加进去
  csrf: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL || '',
    // 👇 同样加在这里
    'https://cura-lab-web-hvtq.vercel.app',
    'https://cura-lab-web.vercel.app',
  ].filter(Boolean),
  collections: [Users, Media, Galleries, Exhibitions, Artworks, Submissions],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // DATABASE: Neon Postgres
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    // 2. S3 CONFIGURATION STARTS HERE
    s3Storage({
      collections: {
        'media': true, // Use S3 for the 'media' collection
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || '', // e.g., 'us-east-1'
      },
    }),
    // S3 CONFIGURATION ENDS HERE
  ],
  endpoints: [
    {
      path: '/invite-juror',
      method: 'post',
      handler: async (req: PayloadRequest) => {
        try {
          if (typeof req.json !== 'function') {
            return Response.json(
              { error: 'Invalid request body' },
              { status: 400 },
            )
          }

          const { email, name, exhibitionId, galleryId } = await req.json()

          if (!req.user || (req.user as any).appRole !== 'gallery') {
            return Response.json(
              { error: 'Only gallery owners can invite jurors' },
              { status: 403 },
            )
          }

          const exhibition = await req.payload.findByID({
            collection: 'exhibitions',
            id: exhibitionId,
            depth: 1,
          })

          const exhibitionGalleryId =
            typeof exhibition.gallery === 'object'
              ? exhibition.gallery.id
              : exhibition.gallery

          if (exhibitionGalleryId !== galleryId) {
            return Response.json(
              { error: 'You can only invite jurors to your own exhibitions' },
              { status: 403 },
            )
          }

          const result = await inviteJuror(req.payload, {
            email,
            name,
            exhibitionId,
            galleryId,
          })

          return Response.json(result, { status: 200 })
        } catch (error: any) {
          console.error('Invite juror endpoint error:', error)
          return Response.json(
            { error: error?.message ?? 'Failed to invite juror' },
            { status: 500 },
          )
        }
      },
    },
  ],
})