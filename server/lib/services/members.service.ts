import { createNeonAuthEmailUser } from '../neonAuthUsers'
import { sendPhoneVerification, sendSms } from '../twilio'
import { normalizePhone } from '../../utils/phone'
import type { H3Event } from 'h3'

export interface CreateChildAccountInput {
  username: string
  email: string
  password: string
  role: 'CHILD' | 'TEEN'
  birthday?: string
}

export interface CompanyInviteInput {
  phone: string
  email?: string
  role: 'FINANCE_ADMIN' | 'GUEST'
  name?: string
}

export interface FamilyInviteInput {
  email: string
  role: 'CO_GUARDIAN'
  name?: string
}

function assertFamilySpace(type: string) {
  if (type !== 'FAMILY' && type !== 'HOUSEHOLD') {
    throw createError({ statusCode: 400, message: 'Child accounts can only be created in family or household spaces' })
  }
}

function assertCompanySpace(type: string) {
  if (type !== 'COMPANY') {
    throw createError({ statusCode: 400, message: 'Phone invites are only for business spaces' })
  }
}

export async function createChildAccount(
  guardianId: string,
  spaceId: string,
  spaceType: string,
  input: CreateChildAccountInput,
  event?: H3Event
) {
  assertFamilySpace(spaceType)

  const email = input.email.toLowerCase().trim()

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw createError({ statusCode: 409, message: 'An account with this email already exists' })
  }

  const authUser = await createNeonAuthEmailUser({
    email,
    password: input.password,
    name: input.username.trim()
  }, event)

  await prisma.user.create({
    data: {
      id: authUser.id,
      email,
      name: input.username.trim(),
      birthday: input.birthday ? new Date(input.birthday) : null
    }
  })

  const member = await prisma.spaceMember.create({
    data: {
      spaceId,
      userId: authUser.id,
      email,
      role: input.role,
      status: 'ACTIVE',
      name: input.username.trim(),
      birthday: input.birthday ? new Date(input.birthday) : null,
      invitedBy: guardianId,
      joinedAt: new Date()
    }
  })

  await prisma.childProfile.create({
    data: { spaceId, memberId: member.id }
  })

  return { member, userId: authUser.id }
}

export async function inviteCompanyMember(
  inviterId: string,
  spaceId: string,
  spaceName: string,
  spaceType: string,
  input: CompanyInviteInput,
  appUrl: string
) {
  assertCompanySpace(spaceType)

  const phone = normalizePhone(input.phone)
  if (!phone) {
    throw createError({ statusCode: 400, message: 'Phone must be a valid number in E.164 format' })
  }

  const email = input.email?.trim().toLowerCase() || null

  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      const member = await prisma.spaceMember.upsert({
        where: { spaceId_userId: { spaceId, userId: existingUser.id } },
        create: {
          spaceId,
          userId: existingUser.id,
          email,
          phone,
          role: input.role,
          status: 'ACTIVE',
          name: input.name ?? existingUser.name,
          invitedBy: inviterId,
          joinedAt: new Date()
        },
        update: {
          role: input.role,
          status: 'ACTIVE',
          phone,
          name: input.name ?? existingUser.name
        }
      })
      return { member, invited: false, inviteUrl: null, token: null }
    }
  }

  const existingPhoneMember = await prisma.spaceMember.findFirst({
    where: { spaceId, phone, status: { in: ['PENDING', 'ACTIVE'] } }
  })
  if (existingPhoneMember) {
    throw createError({ statusCode: 409, message: 'This phone number is already invited or on the team' })
  }

  const invitation = await prisma.spaceInvitation.create({
    data: {
      spaceId,
      email,
      phone,
      name: input.name?.trim() || null,
      role: input.role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  const member = await prisma.spaceMember.create({
    data: {
      spaceId,
      email,
      phone,
      role: input.role,
      status: 'PENDING',
      name: input.name?.trim() || null,
      invitedBy: inviterId
    }
  })

  const inviteUrl = `${appUrl}/dashboard/invite/${invitation.token}`

  try {
    await sendPhoneVerification(phone)
  } catch {
    // NOTE - Verification retried on invite page
  }

  try {
    await sendSms(phone, `You've been invited to ${spaceName} on FlowRate. Join: ${inviteUrl}`)
  } catch {
    // NOTE - SMS failure must not block invite creation
  }

  return { member, invited: true, inviteUrl, token: invitation.token }
}

export async function inviteFamilyMember(
  inviterId: string,
  spaceId: string,
  spaceType: string,
  input: FamilyInviteInput,
  appUrl: string
) {
  if (spaceType !== 'FAMILY' && spaceType !== 'HOUSEHOLD') {
    throw createError({ statusCode: 400, message: 'Invalid space type for guardian invite' })
  }

  const email = input.email.toLowerCase().trim()
  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    const member = await prisma.spaceMember.upsert({
      where: { spaceId_userId: { spaceId, userId: existingUser.id } },
      create: {
        spaceId,
        userId: existingUser.id,
        email,
        role: input.role,
        status: 'ACTIVE',
        name: input.name ?? existingUser.name,
        invitedBy: inviterId,
        joinedAt: new Date()
      },
      update: {
        role: input.role,
        status: 'ACTIVE',
        name: input.name ?? existingUser.name
      }
    })
    return { member, invited: false, inviteUrl: null, token: null }
  }

  const invitation = await prisma.spaceInvitation.create({
    data: {
      spaceId,
      email,
      role: input.role,
      name: input.name?.trim() || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  const member = await prisma.spaceMember.create({
    data: {
      spaceId,
      email,
      role: input.role,
      status: 'PENDING',
      name: input.name?.trim() || null,
      invitedBy: inviterId
    }
  })

  return {
    member,
    invited: true,
    inviteUrl: `${appUrl}/dashboard/invite/${invitation.token}`,
    token: invitation.token
  }
}

export async function verifyInvitationPhone(token: string, code: string) {
  const invitation = await prisma.spaceInvitation.findUnique({ where: { token } })
  if (!invitation || invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 404, message: 'Invitation expired or not found' })
  }
  if (!invitation.phone) {
    throw createError({ statusCode: 400, message: 'This invitation does not require phone verification' })
  }

  const { checkPhoneVerification } = await import('../twilio')
  const approved = await checkPhoneVerification(invitation.phone, code)
  if (!approved) {
    throw createError({ statusCode: 400, message: 'Invalid or expired verification code' })
  }

  await prisma.spaceInvitation.update({
    where: { id: invitation.id },
    data: { phoneVerified: new Date() }
  })

  return { verified: true }
}

export async function resendInvitationPhoneCode(token: string) {
  const invitation = await prisma.spaceInvitation.findUnique({ where: { token } })
  if (!invitation || invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 404, message: 'Invitation expired or not found' })
  }
  if (!invitation.phone) {
    throw createError({ statusCode: 400, message: 'This invitation does not require phone verification' })
  }

  await sendPhoneVerification(invitation.phone)
  return { sent: true }
}

function phoneLoginEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `phone+${digits}@flowrate.app`
}

export async function completePhoneInvitation(
  token: string,
  input: { password: string, email?: string, name?: string },
  event?: H3Event
) {
  const invitation = await prisma.spaceInvitation.findUnique({
    where: { token },
    include: { space: true }
  })

  if (!invitation || invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 404, message: 'Invitation expired or not found' })
  }
  if (!invitation.phone) {
    throw createError({ statusCode: 400, message: 'This invitation does not require registration' })
  }
  if (!invitation.phoneVerified) {
    throw createError({ statusCode: 400, message: 'Verify your phone number first' })
  }

  const email = input.email?.trim().toLowerCase()
    || invitation.email?.toLowerCase()
    || phoneLoginEmail(invitation.phone)

  const name = input.name?.trim() || invitation.name || email.split('@')[0] || 'Member'

  let userId: string

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    userId = existingUser.id
  } else {
    const authUser = await createNeonAuthEmailUser({
      email,
      password: input.password,
      name: name
    }, event)
    userId = authUser.id
    await prisma.user.create({
      data: {
        id: authUser.id,
        email,
        name: name,
        phone: invitation.phone,
        phoneVerified: invitation.phoneVerified
      }
    })
  }

  await prisma.spaceMember.upsert({
    where: {
      spaceId_email: { spaceId: invitation.spaceId, email }
    },
    create: {
      spaceId: invitation.spaceId,
      userId,
      email,
      phone: invitation.phone,
      role: invitation.role,
      status: 'ACTIVE',
      name: name,
      joinedAt: new Date()
    },
    update: {
      userId,
      phone: invitation.phone,
      status: 'ACTIVE',
      role: invitation.role,
      joinedAt: new Date()
    }
  })

  await prisma.spaceInvitation.delete({ where: { id: invitation.id } })

  await prisma.user.update({
    where: { id: userId },
    data: { spaceId: invitation.spaceId }
  })

  return { spaceId: invitation.spaceId, spaceName: invitation.space.name, userId, loginEmail: email }
}

export async function acceptEmailInvitation(token: string, userId: string, userEmail: string) {
  const invitation = await prisma.spaceInvitation.findUnique({
    where: { token },
    include: { space: true }
  })

  if (!invitation || invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 404, message: 'Invitation expired or not found' })
  }

  if (invitation.phone && !invitation.phoneVerified) {
    throw createError({ statusCode: 400, message: 'Verify your phone number first' })
  }

  if (invitation.email && invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw createError({ statusCode: 403, message: 'This invitation is for a different email address' })
  }

  const email = userEmail.toLowerCase()

  await prisma.spaceMember.upsert({
    where: {
      spaceId_email: { spaceId: invitation.spaceId, email }
    },
    create: {
      spaceId: invitation.spaceId,
      userId,
      email,
      phone: invitation.phone,
      role: invitation.role,
      status: 'ACTIVE',
      name: invitation.name,
      joinedAt: new Date()
    },
    update: {
      userId,
      phone: invitation.phone ?? undefined,
      status: 'ACTIVE',
      role: invitation.role,
      joinedAt: new Date()
    }
  })

  await prisma.spaceInvitation.delete({ where: { id: invitation.id } })

  await prisma.user.update({
    where: { id: userId },
    data: { spaceId: invitation.spaceId }
  })

  return { spaceId: invitation.spaceId, spaceName: invitation.space.name }
}
