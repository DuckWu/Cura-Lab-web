import { CollectionConfig } from 'payload'

// (!!) 1. (!! 关键修复 !!)
// 我们的 APP_ROLES 必须包含 'admin'
export const APP_ROLES = {
  admin: 'admin',
  artist: 'artist',
  gallery: 'gallery',
  juror: 'juror',
  user: 'user', // 普通用户
} as const

export const Users: CollectionConfig = {
  slug: 'users',
  // (!!) Payload 的内置 auth 功能
  auth: {
    // 允许跨域 Cookie 的关键配置
    cookies: {
      sameSite: 'None', // 允许跨站 (Cross-Site)
      secure: true,     // 必须是 HTTPS (Vercel 默认就是 HTTPS，所以没问题)
      domain: undefined // 不要设置 domain，让它自动匹配
    },
    // 其他 auth 配置...
    tokenExpiration: 7200, // 2小时过期
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // 任何人都可以创建（注册）新用户
    create: () => true,
    read: ({ req }) => {
      if (!req.user) return false

      // 1. admin：看全部
      if (req.user.appRole === APP_ROLES.admin) return true

      // 2. gallery：能看自己 + 所有 juror
      if (req.user.appRole === APP_ROLES.gallery) {
        return {
          or: [
            {
              id: {
                equals: req.user.id,           // 允许看自己
              },
            },
            {
              appRole: {
                equals: APP_ROLES.juror,       // 允许看所有评委
              },
            },
            // 🚀 核心修改：允许看所有画廊用户（这样才能选自己或其他画廊）
            {
              appRole: {
                equals: APP_ROLES.gallery,
              },
            },
          ],
        } as any // ⬅⬅⬅ 关键：这里加 as any，压住 TS 报错
      }

      // 3. 其他角色：只能看自己
      return {
        id: {
          equals: req.user.id,
        },
      } as any
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.appRole === APP_ROLES.admin) return true // 允许 admin
      return {
        id: {
          equals: req.user.id, // 允许用户自己
        },
      }
    },
    // 只有 'admin' 能删除
    delete: ({ req }) => req.user?.appRole === APP_ROLES.admin,
  },
  fields: [
    // (!!) 3. (!! 关键 !!)
    // 这就是我们唯一的角色系统
    {
      name: 'appRole',
      type: 'select',
      options: [
        { label: 'Admin', value: APP_ROLES.admin }, // <-- 添加 'Admin' 选项
        { label: 'Artist', value: APP_ROLES.artist },
        { label: 'Gallery', value: APP_ROLES.gallery },
        { label: 'Juror', value: APP_ROLES.juror },
        { label: 'User', value: APP_ROLES.user },
      ],
      required: true,
      defaultValue: APP_ROLES.user,
 
      access: {

        create: ({ req }) => true,
        update: ({ req }) => req.user?.appRole === APP_ROLES.admin,
        read: ({ req }) => {
          if (!req.user) return false
          return true // 登录后才能看到自己的角色
        }
      },
      // (!!) 5. (!! 推荐 !!)
      // 像官方示例一样，把这个角色保存到 JWT (登录令牌) 中
      // 这样 req.user 上下文里总能读到它
      saveToJWT: true,
      admin: {
        // ✅ 新增：在创建用户时隐藏这个字段（防止注册时选择角色）
        condition: (data, siblingData, { user }) => {
          // 如果是新建用户且当前用户不是 admin，隐藏角色选择
          if (!data?.id && user?.appRole !== APP_ROLES.admin) {
            return false
          }
          return true
        },
        
      }
    },
    // （你也可以在这里添加 'name' 或 'bio' 字段）
    {
      name: 'name',
      type: 'text',
      required: false,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create') {
          // 如果已经显式传了 appRole（包括 'juror'），就尊重它
          if (!data.appRole) {
            data.appRole = APP_ROLES.user
          }
        }

        // 更新时只有 admin 能改 appRole，这个逻辑仍然保留
        if (operation === 'update' && req.user?.appRole !== APP_ROLES.admin) {
          delete data.appRole
        }

        return data
      },
    ],
  },
}