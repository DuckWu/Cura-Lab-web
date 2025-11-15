import { CollectionConfig } from 'payload'
import { APP_ROLES } from './Users'

interface CorrectUser {
  id: number | string
  appRole: 'artist' | 'gallery' | 'juror' | 'user' | 'admin'
  role: 'admin' | 'user'
}

export const Artworks: CollectionConfig = {
  slug: 'artworks',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'owner', 'category', 'sale_status', 'status'],
  },
  access: {
    create: ({ req }) => {
      const user = req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true
      return user.appRole === APP_ROLES.artist
    },
    
    read: ({ req }) => {
      const user = req.user as CorrectUser | null | undefined
      
      // 未登录用户可以看已发布的作品
      if (!user) {
        return {
          status: {
            equals: 'published',
          },
        }
      }
      
      // Admin 可以看所有
      if (user.appRole === APP_ROLES.admin) return true
      
      // Artist 可以看自己的所有作品
      if (user.appRole === APP_ROLES.artist) {
        return {
          or: [
            { owner: { equals: user.id } },
            { status: { equals: 'published' } },
          ],
        } as any
      }
      
      // Gallery 和 Juror 可以看所有已发布的
      if (user.appRole === APP_ROLES.gallery || user.appRole === APP_ROLES.juror) {
        return {
          status: {
            equals: 'published',
          },
        }
      }
      
      // 其他登录用户可以看已发布的
      return {
        status: {
          equals: 'published',
        },
      }
    },
    
    update: async ({ req, id }) => {
      if (!id) return false
      const user = req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true

      try {
        const artwork = await req.payload.findByID({
          collection: 'artworks',
          id,
          depth: 0,
          user: req.user,
        })
        return (artwork.owner as any) === user.id
      } catch (e) {
        return false
      }
    },
    
    delete: async ({ req, id }) => {
      if (!id) return false
      const user = req.user as CorrectUser | null | undefined
      if (!user) return false
      if (user.appRole === APP_ROLES.admin) return true

      try {
        const artwork = await req.payload.findByID({
          collection: 'artworks',
          id,
          depth: 0,
          user: req.user,
        })
        return (artwork.owner as any) === user.id
      } catch (e) {
        return false
      }
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
      admin: {
        description: 'Additional images of the artwork',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Painting', value: 'painting' },
        { label: 'Sculpture', value: 'sculpture' },
        { label: 'Photography', value: 'photography' },
        { label: 'Digital Art', value: 'digital' },
        { label: 'Mixed Media', value: 'mixed_media' },
        { label: 'Print', value: 'print' },
        { label: 'Drawing', value: 'drawing' },
        { label: 'Other', value: 'other' },
      ],
      required: true,
    },
    {
      name: 'medium',
      type: 'text',
      admin: {
        description: 'e.g., "Oil on canvas"',
      },
    },
    {
      name: 'materials',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Detailed materials description',
      },
    },
    {
      name: 'dimensions',
      type: 'group',
      fields: [
        {
          name: 'width',
          type: 'number',
          required: true,
          admin: {
            description: 'Width',
            step: 0.1,
          },
          min: 0,
        },
        {
          name: 'height',
          type: 'number',
          required: true,
          admin: {
            description: 'Height',
            step: 0.1,
          },
          min: 0,
        },
        {
          name: 'depth',
          type: 'number',
          required: false,
          admin: {
            description: 'Depth (optional, for sculptures and 3D works)',
            step: 0.1,
          },
          min: 0,
        },
        {
          name: 'unit',
          type: 'select',
          options: [
            { label: 'Inches (in)', value: 'in' },
            { label: 'Centimeters (cm)', value: 'cm' },
          ],
          defaultValue: 'in',
          required: true,
        },
      ],
      admin: {
        description: 'Physical dimensions of the artwork',
      },
    },
    {
      name: 'dimensionsDisplay',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-generated dimension string',
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'year',
      type: 'number',
      required: false,
      admin: {
        description: 'Year created',
      },
    },
    {
      name: 'edition',
      type: 'text',
      required: false,
      admin: {
        description: 'Edition info (e.g., "1/10" for limited editions)',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => user?.id,
      access: {
        update: ({ req }) => (req.user as CorrectUser | null | undefined)?.appRole === APP_ROLES.admin,
      },
      filterOptions: {
        appRole: {
          equals: APP_ROLES.artist,
        },
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sale_status',
      type: 'select',
      options: [
        { label: 'Not for Sale', value: 'not_for_sale' },
        { label: 'For Sale', value: 'for_sale' },
        { label: 'Sale Pending', value: 'pending' },
        { label: 'Sold', value: 'sold' },
      ],
      defaultValue: 'not_for_sale',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Current asking price',
        condition: (data) => data?.sale_status === 'for_sale' || data?.sale_status === 'pending',
      },
    },
    {
      name: 'sold_price',
      type: 'number',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Actual sold price',
        condition: (data) => data?.sale_status === 'sold',
      },
    },
    {
      name: 'sold_date',
      type: 'date',
      required: false,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.sale_status === 'sold',
      },
    },
    {
      name: 'buyer',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.sale_status === 'sold',
      },
    },
    {
      name: 'label_number',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Assigned by the gallery after acceptance',
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
        if (operation === 'create' && data?.title && !data?.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }
        if (data?.dimensions) {
          const { width, height, depth, unit } = data.dimensions
          if (width && height) {
            if (depth) {
              data.dimensionsDisplay = `${width} × ${height} × ${depth} ${unit}`
            } else {
              data.dimensionsDisplay = `${width} × ${height} ${unit}`
            }
          }
        }
        return data
      },
    ],
  },
}