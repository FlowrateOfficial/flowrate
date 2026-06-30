import { accountDeleteBodySchema } from '../../lib/schemas/api'
import { deleteOwnUserAccount } from '../../lib/services/user-deletion.service'
import { clearNeonAuthCookies } from '../../utils/neonAuthProxy'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).then(b => accountDeleteBodySchema.parse(b ?? {}))

  const result = await deleteOwnUserAccount(event, {
    confirmEmail: body.confirmEmail,
    emailCode: body.emailCode,
    phoneCode: body.phoneCode,
    password: body.password
  })

  deleteCookie(event, 'flowrate-active-space', { path: '/' })
  clearNeonAuthCookies(event)

  return {
    ok: true,
    deleted: result
  }
})
