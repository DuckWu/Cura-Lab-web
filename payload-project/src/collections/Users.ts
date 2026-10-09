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
    // sameSite=None + secure requires HTTPS; on local HTTP dev the browser
    // would silently drop the auth cookie and login would never "stick".
    cookies: {
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      secure: process.env.NODE_ENV === 'production',
      domain: undefined, // 不要设置 domain，让它自动匹配
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

        // Field-level create stays permissive: the beforeChange hook below is
        // the single enforcement point for role assignment (it strips any
        // disallowed role, so a restrictive field rule here would only break
        // the legitimate artist/gallery signup flow).
        create: () => true,
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
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          // Defense in depth: only an admin creating the user may assign any
          // role freely. Public registration may choose from a safe allowlist
          // (artist/gallery) — never admin/juror — even if appRole was
          // explicitly passed in the request body. Internal flows (e.g. juror
          // invitations) opt in via req.context.
          const SELF_ASSIGNABLE = [APP_ROLES.artist, APP_ROLES.gallery]
          const allowRoleAssignment =
            (req as any).context?.allowRoleAssignment === true
          if (
            allowRoleAssignment ||
            req.user?.appRole === APP_ROLES.admin
          ) {
            if (!data.appRole) data.appRole = APP_ROLES.user
          } else if (SELF_ASSIGNABLE.includes(data.appRole)) {
            // respect the signup role choice
          } else if (data.appRole) {
            // Bootstrap escape hatch: on a completely fresh database with zero
            // users, honor an explicitly requested role so the first admin can
            // be created (Payload's register-first-user flow hits this path
            // with an anonymous req). The window closes permanently as soon as
            // the first user exists.
            const { totalDocs } = await req.payload.count({
              collection: 'users',
              overrideAccess: true,
            })
            if (totalDocs !== 0) {
              data.appRole = APP_ROLES.user
            }
          } else {
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