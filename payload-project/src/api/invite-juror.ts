// payload-project/src/api/invite-juror.ts
import { Payload } from 'payload'
import { APP_ROLES } from '../collections/Users'
interface InviteJurorParams {
  email: string
  name: string
  exhibitionId: number
  galleryId: number
}

export async function inviteJuror(
  payload: Payload,
  { email, name, exhibitionId, galleryId }: InviteJurorParams
) {
  try {
    // 1. 检查用户是否已存在
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
      overrideAccess: true, 
    })

    let jurorUser

    if (existingUsers.docs.length > 0) {
      // 用户已存在
      jurorUser = existingUsers.docs[0]
      
      // 如果不是 juror，更新为 juror
      if (jurorUser.appRole !== 'juror') {
        jurorUser = await payload.update({
          collection: 'users',
          id: jurorUser.id,
          data: {
            appRole: 'juror',
          },
          overrideAccess: true,
        })
      }
    } else {
      // 2. 创建新的 Juror 用户
      const tempPassword = generateRandomPassword()
      
      jurorUser = await payload.create({
        collection: 'users',
        data: {
          email,
          name,
          password: tempPassword,
          appRole: APP_ROLES.juror,
        },
        overrideAccess: true,
      })

      // 3. 发送邀请邮件
      await sendInvitationEmail({
        to: email,
        name,
        tempPassword,
        exhibitionId,
      })
    }

    // 4. 将 juror 添加到展览
    const exhibition = await payload.findByID({
      collection: 'exhibitions',
      id: exhibitionId,
      depth: 1,
      overrideAccess: true,
    })

    const currentJurors = (exhibition.jurors as any[] || []).map((j: any) => 
      typeof j === 'object' ? j.id : j
    )

    if (!currentJurors.includes(jurorUser.id)) {
      await payload.update({
        collection: 'exhibitions',
        id: exhibitionId,
        data: {
          jurors: [...currentJurors, jurorUser.id],
        },
        overrideAccess: true,
      })
    }

    return {
      success: true,
      juror: jurorUser,
      isNewUser: existingUsers.docs.length === 0,
    }
  } catch (error: any) {
    console.error('Invite juror error:', error)
    throw error
  }
}

// 生成随机密码
function generateRandomPassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// 发送邀请邮件（简化版，你需要配置 Payload 的邮件服务）
async function sendInvitationEmail({
  to,
  name,
  tempPassword,
  exhibitionId,
}: {
  to: string
  name: string
  tempPassword: string
  exhibitionId: number
}) {
  // 这里需要配置 Payload 的邮件服务
  // 暂时只打印到控制台
  console.log(`
    =================================
    JUROR INVITATION EMAIL
    =================================
    To: ${to}
    Subject: You've been invited as a juror
    
    Hi ${name},
    
    You've been invited to be a juror for an exhibition on CURA LAB.
    
    Login credentials:
    Email: ${to}
    Temporary Password: ${tempPassword}
    
    Login at: http://localhost:5173
    
    Please change your password after first login.
    =================================
  `)
  
  // TODO: 实际发送邮件
  // 可以使用 Payload 的邮件插件或 Nodemailer
}