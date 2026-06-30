import { accountDeleteBodySchema } from '../../lib/schemas/api'
import { deleteOwnUserAccount } from '../../lib/services/user-deletion.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).then(b => accountDeleteBodySchema.parse(b ?? {}))

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
