// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
  cors: [
    'http://localhost:5173',
    'http://localhost:5174', // Vite 前端
    'http://localhost:3000', // 如果你的 Payload admin 在 3000 端口
    process.env.FRONTEND_URL || 'http://localhost:5174', // 生产环境
  ].filter(Boolean),
  collections: [Users, Media, Galleries, Exhibitions, Artworks, Submissions],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
  csrf: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
 endpoints: [
  {
    path: '/invite-juror',
    method: 'post',
    handler: async (req: PayloadRequest) => {
      try {
        // 先确认 json 存在
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
