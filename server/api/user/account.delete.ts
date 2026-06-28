import { z } from 'zod'
import { deleteOwnUserAccount } from '../../lib/services/user-deletion.service'

const bodySchema = z.object({
  confirmEmail: z.string().email(),
  password: z.string().min(1).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event).then(b => bodySchema.parse(b ?? {}))

  const result = await deleteOwnUserAccount(event, {
    confirmEmail: body.confirmEmail,
    password: body.password
  })

  deleteCookie(event, 'flowrate-active-space', { path: '/' })

  return {
    ok: true,
    deleted: result
  }
})
