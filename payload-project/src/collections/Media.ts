import { CollectionConfig } from 'payload'
import { APP_ROLES } from './Users'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // 🔧 确保 artist 可以上传
    create: ({ req }) => {
      if (!req.user) return false
      if (req.user.appRole === APP_ROLES.admin) return true
      if (req.user.appRole === APP_ROLES.artist) return true  // ✅ 添加这个
      if (req.user.appRole === APP_ROLES.gallery) return true
      return false
    },
    read: () => true, // 所有人可以读取（公开图片）
    update: ({ req }) => {
      if (!req.user) return false
      return req.user.appRole === APP_ROLES.admin
    },
    delete: ({ req }) => {
      if (!req.user) return false
      return req.user.appRole === APP_ROLES.admin
    },
  },
  upload: {
    staticDir: './media', // 确保这个文件夹存在
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}