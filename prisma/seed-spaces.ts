import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()

  for (const user of users) {
    const existing = await prisma.spaceMember.findFirst({
      where: { userId: user.id, space: { type: 'INDEPENDENT' } }
    })
    if (existing) continue

    const space = await prisma.financialSpace.create({
      data: {
        name: user.name ? `${user.name}'s Finances` : 'My Finances',
        type: 'INDEPENDENT',
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
            status: 'ACTIVE',
            displayName: user.name,
            joinedAt: new Date()
          }
        }
      }
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { activeSpaceId: space.id }
    })

    await prisma.$transaction([
      prisma.account.updateMany({ where: { userId: user.id }, data: { spaceId: space.id } }),
      prisma.transaction.updateMany({ where: { userId: user.id }, data: { spaceId: space.id } }),
      prisma.budget.updateMany({ where: { userId: user.id }, data: { spaceId: space.id } }),
      prisma.detectedSubscription.updateMany({ where: { userId: user.id }, data: { spaceId: space.id } })
    ])

    console.log(`Migrated user ${user.email} -> space ${space.id}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
