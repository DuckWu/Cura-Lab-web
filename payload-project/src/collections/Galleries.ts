import { CollectionConfig } from 'payload'
import { APP_ROLES } from './Users'

export const Galleries: CollectionConfig = {
  slug: 'galleries',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'owner', 'status'],
  },
  access: {
    read: ({ req }) => {
      if (req.user?.appRole === APP_ROLES.admin) return true
      
      if (req.user?.appRole === APP_ROLES.gallery) {
        return {
          or: [
            { status: { equals: 'published' } },
            { owner: { equals: req.user.id } },
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
      if (!req.user) return false
      if (req.user.appRole === APP_ROLES.admin) return true
      return req.user.appRole === APP_ROLES.gallery
    },
    
    update: async ({ req, id }) => {
      if (!id) return false
      if (!req.user) return false
      if (req.user.appRole === APP_ROLES.admin) return true

      if (req.user.appRole === APP_ROLES.gallery) {
        try {
          const gallery = await req.payload.findByID({
            collection: 'galleries',
            id,
            depth: 0,
            user: req.user,
          })
          return gallery.owner === req.user.id
        } catch (e) {
          return false
        }
      }
      return false
    },
    
    delete: async ({ req, id }) => {
      if (!id) return false
      if (!req.user) return false
      if (req.user.appRole === APP_ROLES.admin) return true

      if (req.user.appRole === APP_ROLES.gallery) {
        try {
          const gallery = await req.payload.findByID({
            collection: 'galleries',
            id,
            depth: 0,
            user: req.user,
          })
          return gallery.owner === req.user.id
        } catch (e) {
          return false
        }
      }
      return false
    },
  },
  
  fields: [
    {
      name: 'name',
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
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'email',
      type: 'email',
      required: false,
    },
    {
      name: 'phone',
      type: 'text',
      required: false,
    },
    {
      name: 'website',
      type: 'text',
      required: false,
    },
    {
      name: 'commissionRate',
      type: 'number',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Commission rate (%) for artwork sales',
      },
      defaultValue: 0,
      min: 0,
      max: 100,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => user?.id,
      access: {
        update: ({ req }) => req.user?.appRole === APP_ROLES.admin,
      },
      filterOptions: {
        appRole: {
          equals: APP_ROLES.gallery,
        },
      },
      admin: {
        position: 'sidebar',
        description: 'The gallery user who owns this entry.',
      },
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
      ({ data, operation }) => {
        // 自动生成 slug
        if (operation === 'create' && data?.name && !data?.slug) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        return data
      },
    ],
  },
}