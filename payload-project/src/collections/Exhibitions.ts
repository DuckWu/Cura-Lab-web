import { CollectionConfig } from 'payload'
import { APP_ROLES } from './Users'

interface CorrectUser {
  id: number | string
  appRole: 'artist' | 'gallery' | 'juror' | 'user' | 'admin'
  role: 'admin' | 'user'
}

export const Exhibitions: CollectionConfig = {
  slug: 'exhibitions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'gallery', 'exhibitionStatus', 'submission_deadline', 'status'],
  },
  access: {
    read: async (args: any) => {
      const user = args.req.user as CorrectUser | null | undefined
      
      if (user?.appRole === APP_ROLES.admin) return true
      
      if (user?.appRole === APP_ROLES.gallery) {
        return {
          or: [
            { status: { equals: 'published' } },
            { 'gallery.owner': { equals: user.id } },
          ],
        } as any
      }
      
      if (user?.appRole === APP_ROLES.juror) {
        return {
          or: [
            { status: { equals: 'published' } },
            { jurors: { contains: user.id } },
          ],
        } as any
      }
      
      return {
        status: {
          equals: 'published',
        },
      }
    },
    
    create: ({ req }) => {
      const user = req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true
      return user.appRole === APP_ROLES.gallery
    },

    update: async ({ req, id }) => {
      if (!id) return false
      const user = req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true

      if (user.appRole === APP_ROLES.gallery) {
        try {
          const exhibition = await req.payload.findByID({
            collection: 'exhibitions',
            id,
            depth: 1,
            user: req.user,
          })
          
          const galleryOwnerID = (exhibition.gallery as any)?.owner?.id || (exhibition.gallery as any)?.owner
          return galleryOwnerID === user.id
        } catch (e) {
          return false
        }
      }
      return false
    },
    
    delete: async ({ req, id }) => {
      if (!id) return false
      const user = req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true

      if (user.appRole === APP_ROLES.gallery) {
        try {
          const exhibition = await req.payload.findByID({
            collection: 'exhibitions',
            id,
            depth: 1,
            user: req.user,
          })
          const galleryOwnerID = (exhibition.gallery as any)?.owner?.id || (exhibition.gallery as any)?.owner
          return galleryOwnerID === user.id
        } catch (e) {
          return false
        }
      }
      return false
    },
  },
  
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'cover_image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'galleries',
      required: true,
      access: {
        update: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.admin,
      },
    },
    {
      name: 'start_date',
      type: 'date',
      required: true,
    },
    {
      name: 'end_date',
      type: 'date',
      required: true,
    },
    {
      name: 'submission_deadline',
      type: 'date',
      required: true,
      admin: {
        description: 'Deadline for artists to submit their work',
      },
    },
    {
      name: 'submission_fee',
      type: 'number',
      required: true,
      admin: {
        description: 'Enter fee in dollars (e.g., 35)',
      },
      min: 0,
    },
    {
      name: 'platformFeePercentage',
      type: 'number',
      required: true,
      defaultValue: 10,
      admin: {
        position: 'sidebar',
        description: 'Platform fee percentage (e.g., 10 for 10%)',
      },
      min: 0,
      max: 100,
      access: {
        update: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.admin,
      },
    },
    {
      name: 'max_selected',
      type: 'number',
      required: true,
      defaultValue: 50,  // 🆕 添加默认值
      admin: {
        position: 'sidebar',  // 🆕 移到 sidebar
        description: 'Maximum number of artworks that can be selected for this exhibition',
      },
      min: 1,
    },

    {
      name: 'selectedCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Current number of selected artworks',
      },
      access: {
        // 允许系统更新，但不允许用户手动更新
        update: ({ req }) => {
          // 如果是系统内部调用（来自 hook），允许更新
          return true
        },
      },
    },
    {
      name: 'jurors',
      type: 'relationship', 
      relationTo: 'users',
      hasMany: true,
      filterOptions: {
        appRole: {
          equals: APP_ROLES.juror,
        },
      },
      admin: {
        description: 'Assign jurors to review submissions',
      },
    },
    {
      name: 'exhibitionStatus',
      type: 'select',
      options: [
        { label: 'Open for Submissions', value: 'open' },
        { label: 'In Jury Review', value: 'jury_review' },
        { label: 'Finalized', value: 'finalized' },
        { label: 'On Display', value: 'on_display' },
        { label: 'Completed', value: 'completed' },
      ],
      defaultValue: 'open',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Current stage of the exhibition',
      },
    },
    {
      name: 'totalSubmissions',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Total number of submissions received',
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'totalRevenue',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Total revenue from submission fees',
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'juryProgress',
      type: 'group',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'totalReviewed',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'accepted',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'rejected',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  
  hooks: {
    beforeChange: [
      async ({ data, req, operation, context }) => {
        // 🔧 如果是从其他 hook 触发的更新，跳过所有验证和逻辑
        if (context?.skipHooks) {
          console.log('✅ Skipping Exhibition beforeChange (triggered by hook)')
          return data
        }

        console.log('Running Exhibition beforeChange normally')

        // 自动关联 gallery
        if (operation === 'create' && !data.gallery) {
          const user = req.user as CorrectUser | null | undefined
          
          if (user?.appRole === APP_ROLES.gallery) {
            const userGalleries = await req.payload.find({
              collection: 'galleries',
              where: {
                owner: {
                  equals: user.id,
                },
              },
              limit: 1,
              depth: 0,
            })
            
            if (userGalleries.docs.length > 0) {
              data.gallery = userGalleries.docs[0].id
            }
          }
        }
        
        // 自动生成 slug
        if (operation === 'create' && data?.title && !data?.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        
        // 验证 max_selected 不小于 selectedCount
        if (operation === 'update' && data.max_selected !== undefined) {
          const currentSelectedCount = data.selectedCount || 0
          if (data.max_selected < currentSelectedCount) {
            throw new Error(
              `Cannot set max_selected to ${data.max_selected}. You currently have ${currentSelectedCount} artworks selected. Please deselect some artworks first.`
            )
          }
        }
        
        return data
      },
    ],
  },
}