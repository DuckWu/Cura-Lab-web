import { CollectionConfig } from 'payload'
import { APP_ROLES } from './Users'

interface CorrectUser {
  id: number | string
  appRole: 'artist' | 'gallery' | 'juror' | 'user' | 'admin'
  role: 'admin' | 'user'
}

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'artist', 'exhibition', 'juryStatus', 'galleryStatus', 'paymentStatus'],
  },
  access: {
    create: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.artist,
    
    read: async (args: any) => {
      const user = args.req.user as CorrectUser | null | undefined
      if (!user) return false
      
      if (user.appRole === APP_ROLES.admin) return true
      
      if (!args.id) {
          return {
              or: [
                  { artist: { equals: user.id } },
                  { 'exhibition.gallery.owner': { equals: user.id } },
                  { 'exhibition.jurors': { contains: user.id } },
              ]
          } as const
      }

      try {
        const submission = await args.req.payload.findByID({
          collection: 'submissions',
          id: args.id,
          depth: 2,
          user,
        })
        
        const exhibition = submission.exhibition as any;

        if (submission.artist.id === user.id) return true

        const galleryOwnerID = (exhibition.gallery as any)?.owner?.id || (exhibition.gallery as any)?.owner
        if (galleryOwnerID === user.id) return true

        const jurors = (exhibition.jurors as any)?.map((j: any) => j.id) || []
        if (jurors.includes(user.id)) return true
        
      } catch (e) {
        return false
      }
      return false
    },

    update: async (args: any) => {
      const user = args.req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true
      
      try {
        const submission = await args.req.payload.findByID({
          collection: 'submissions',
          id: args.id,
          depth: 2, 
          user,
        })
        
        const exhibition = submission.exhibition as any;
        const galleryOwnerID = (exhibition.gallery as any)?.owner?.id || (exhibition.gallery as any)?.owner
        const jurors = (exhibition.jurors as any)?.map((j: any) => j.id) || []

        if (galleryOwnerID === user.id) return true
        
        if (user.appRole === APP_ROLES.juror && jurors.includes(user.id)) return true
        
        if (user.appRole === APP_ROLES.artist && submission.artist.id === user.id && submission.juryStatus === 'pending') {
          return true
        }

      } catch (e) {
        return false
      }
      return false
    },
    
    delete: async (args: any) => {
      const user = args.req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true
      
      try {
        const submission = await args.req.payload.findByID({
          collection: 'submissions',
          id: args.id,
          depth: 0,
          user,
        })
        
        if (user.appRole === APP_ROLES.artist && 
            submission.artist === user.id && 
            submission.juryStatus === 'pending') {
          return true
        }
      } catch (e) {
        return false
      }
      return false
    },
  },
  
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => (user as CorrectUser | null | undefined)?.id,
      access: {
        update: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.admin,
      },
      filterOptions: {
        appRole: {
          equals: APP_ROLES.artist,
        },
      },
    },
    {
      name: 'exhibition',
      type: 'relationship',
      relationTo: 'exhibitions',
      required: true,
      
    },
    {
      name: 'artwork',
      type: 'relationship',
      relationTo: 'artworks',
      required: true,
      filterOptions: ({ user }): any => {
        const u = user as CorrectUser | null | undefined
        if (!u) {
          return { id: { equals: null } }
        }

        if (u.appRole === APP_ROLES.artist) {
          return {
            owner: {
              equals: u.id,
            },
          }
        }

        return {}
      },
    },
    {
      name: 'displayArtists',
      type: 'json',
      admin: {
        description: 'Artist name(s) to display on exhibition tags. Array of strings, e.g. ["Jane Doe", "John Smith"]',
      },
      // 任何人可以读，但只有 artist 本人（创建时）和 admin/gallery 可以改
      access: {
        read: () => true,
        update: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          return (
            user?.appRole === APP_ROLES.admin ||
            user?.appRole === APP_ROLES.gallery ||
            user?.appRole === APP_ROLES.artist
          )
        },
      },
    },
    {
      name: 'juryStatus',
      type: 'select',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'pending',
      access: {
        update: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.admin || (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.juror,
      },
      admin: {
        position: 'sidebar',
        description: 'Set by Jurors during the selection process.',
      },
    },
    {
      name: 'assignedJurors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: {
        appRole: {
          equals: APP_ROLES.juror,
        },
      },
      access: {
        update: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          return (
            user?.appRole === APP_ROLES.admin ||
            user?.appRole === APP_ROLES.gallery
          )
        },
        read: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          if (!user) return false
          if (
            user.appRole === APP_ROLES.admin ||
            user.appRole === APP_ROLES.gallery ||
            user.appRole === APP_ROLES.juror
          ) {
            return true
          }
          return true
        },
      },
      admin: {
        position: 'sidebar',
        description: 'Jurors assigned to review this submission',
      },
    },
    {
      name: 'galleryStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Selected', value: 'selected' },
        { label: 'Not Selected', value: 'not_selected' },
      ],
      defaultValue: 'pending',
      access: {
        update: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.admin || (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.gallery,
      },
      admin: {
        position: 'sidebar',
        description: 'Final selection status by the Gallery.',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Waived', value: 'waived' },
      ],
      defaultValue: 'pending',
      access: {
        update: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.admin || (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.gallery,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentAmount',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Submission fee amount',
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'paymentDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.paymentStatus === 'paid',
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'paymentTransactionId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Stripe/PayPal transaction ID',
        condition: (data) => data?.paymentStatus === 'paid',
      },
      access: {
        read: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          return user?.appRole === APP_ROLES.admin || user?.appRole === APP_ROLES.gallery
        },
      },
    },
    {
      name: 'submittedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When the jury reviewed this submission',
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'juryNotes',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Private notes from jurors (not visible to artists)',
      },
      access: {
        create: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          return user?.appRole === APP_ROLES.juror || user?.appRole === APP_ROLES.admin
        },
        update: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          return user?.appRole === APP_ROLES.juror || user?.appRole === APP_ROLES.admin
        },
        read: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          return user?.appRole === APP_ROLES.juror || 
                 user?.appRole === APP_ROLES.gallery || 
                 user?.appRole === APP_ROLES.admin
        },
      },
    },
    {
      name: 'reviewHistory',
      type: 'array',
      fields: [
        {
          name: 'reviewer',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'action',
          type: 'select',
          options: [
            { label: 'Accepted', value: 'accepted' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Changed to Pending', value: 'pending' },
          ],
        },
        {
          name: 'timestamp',
          type: 'date',
        },
        {
          name: 'notes',
          type: 'textarea',
        },
      ],
      admin: {
        readOnly: true,
      },
      access: {
        update: () => false,
        read: ({ req }) => {
          const user = req.user as CorrectUser | null | undefined
          return user?.appRole === APP_ROLES.admin || 
                 user?.appRole === APP_ROLES.gallery ||
                 user?.appRole === APP_ROLES.juror
        },
      },
    },
  ],
  
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        console.log('=== beforeChange START ===')
        const user = req.user as CorrectUser | null | undefined

        // Helper: extract ID from a value that might be an object or a number
        const toId = (val: any): number | string | undefined => {
          if (!val) return undefined
          if (typeof val === 'object' && val.id) return val.id
          return val
        }
        
        if (operation === 'update' && originalDoc) {
          if (!data.artist && originalDoc.artist) {
            data.artist = toId(originalDoc.artist)
          } else if (data.artist) {
            data.artist = toId(data.artist)
          }
          if (!data.exhibition && originalDoc.exhibition) {
            data.exhibition = toId(originalDoc.exhibition)
          } else if (data.exhibition) {
            data.exhibition = toId(data.exhibition)
          }
          if (!data.artwork && originalDoc.artwork) {
            data.artwork = toId(originalDoc.artwork)
          } else if (data.artwork) {
            data.artwork = toId(data.artwork)
          }
        }

        if (operation === 'create' && data.artwork && data.exhibition) {
          console.log('Checking duplicates...')
          const existingSubmissions = await req.payload.find({
            collection: 'submissions',
            where: {
              and: [
                { artist: { equals: user?.id } },
                { artwork: { equals: toId(data.artwork) } },
                { exhibition: { equals: toId(data.exhibition) } },
              ],
            },
            limit: 1,
          })
          console.log('Duplicates found:', existingSubmissions.docs.length)

          if (existingSubmissions.docs.length > 0) {
            throw new Error('You have already submitted this artwork to this exhibition')
          }
        }

        if (operation === 'create') {
          console.log('Setting submittedAt...')
          data.submittedAt = new Date()

          if (data.exhibition) {
            console.log('Fetching exhibition for fee...')
            const exhibition = await req.payload.findByID({
              collection: 'exhibitions',
              id: toId(data.exhibition)!,
              depth: 0,
            })
            data.paymentAmount = exhibition.submission_fee
            console.log('Payment amount set:', data.paymentAmount)
          }
        }

        if (originalDoc?.juryStatus !== data.juryStatus && data.juryStatus !== 'pending') {
          data.reviewedAt = new Date()
          const historyEntry = {
            reviewer: user?.id,
            action: data.juryStatus,
            timestamp: new Date(),
            notes: data.juryNotes || '',
          }
          data.reviewHistory = [...(originalDoc?.reviewHistory || []), historyEntry]
        }

        // Generate title - use IDs safely
        const artistId = toId(data.artist)
        const exhibitionId = toId(data.exhibition)
        if (artistId && exhibitionId) {
          console.log('Generating title...')
          try {
            const [artist, exhibition] = await Promise.all([
              req.payload.findByID({ collection: 'users', id: artistId, depth: 0 }),
              req.payload.findByID({ collection: 'exhibitions', id: exhibitionId, depth: 0 }),
            ])
            data.title = `${(artist as any).name || artist.email} - ${exhibition.title}`
            console.log('Title generated:', data.title)
          } catch (e) {
            console.log('Title generation failed')
            data.title = `Submission ${data.id || 'New'}`
          }
        }

        console.log('=== beforeChange END ===')
        return data
      },
    ],
    
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        console.log('=== afterChange START ===')
        console.log('Operation:', operation)
        
        // 🔧 处理新提交：用 SQL 直接更新
        if (operation === 'create' && doc.exhibition) {
          try {
            const exhibitionId = typeof doc.exhibition === 'object' 
              ? doc.exhibition.id 
              : doc.exhibition

            console.log('Updating exhibition via SQL:', exhibitionId)
            console.log('Payment amount:', doc.paymentAmount || 0)

            // 🔧 直接 SQL 更新，完全绕过 Payload
            const result = await req.payload.db.pool.query(
              `UPDATE exhibitions 
              SET total_submissions = total_submissions + 1,
                  total_revenue = total_revenue + $1,
                  updated_at = NOW()
              WHERE id = $2
              RETURNING total_submissions, total_revenue`,
              [doc.paymentAmount || 0, exhibitionId]
            )
            
            console.log('✅ SQL update successful:', result.rows[0])
          } catch (e) {
            console.error('❌ SQL update failed:', e)
          }
        }

        // 🔧 处理 galleryStatus 变化：用 SQL 直接更新
        if (operation === 'update' && doc.exhibition) {
          const prevGalleryStatus = previousDoc?.galleryStatus
          const newGalleryStatus = doc.galleryStatus

          const exhibitionId = typeof doc.exhibition === 'object' 
            ? doc.exhibition.id 
            : doc.exhibition

          // 从非 selected 变为 selected：+1
          if (prevGalleryStatus !== 'selected' && newGalleryStatus === 'selected') {
            try {
              console.log('Incrementing selectedCount via SQL')
              
              const result = await req.payload.db.pool.query(
                `UPDATE exhibitions 
                SET selected_count = selected_count + 1,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING selected_count`,
                [exhibitionId]
              )
              
              console.log('✅ selectedCount incremented:', result.rows[0])
            } catch (e) {
              console.error('❌ Failed to increment selectedCount:', e)
            }
          }

          // 从 selected 变为其他状态：-1
          if (prevGalleryStatus === 'selected' && newGalleryStatus !== 'selected') {
            try {
              console.log('Decrementing selectedCount via SQL')
              
              const result = await req.payload.db.pool.query(
                `UPDATE exhibitions 
                SET selected_count = GREATEST(selected_count - 1, 0),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING selected_count`,
                [exhibitionId]
              )
              
              console.log('✅ selectedCount decremented:', result.rows[0])
            } catch (e) {
              console.error('❌ Failed to decrement selectedCount:', e)
            }
          }
        }
        
        console.log('=== afterChange END ===')
      },
    ],
  }
}