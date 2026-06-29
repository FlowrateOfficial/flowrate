import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export interface InviteDetail {
  spaceName: string
  spaceType: string
  role: string
  email?: string | null
  phone?: string | null
  name?: string | null
  requiresPhoneVerification: boolean
  requiresRegistration: boolean
  phoneVerified: boolean
}

export const useInvitesStore = defineStore('invites', () => {
  const spacesStore = useSpacesStore()
  const { api } = useApi()

  const invite = ref<InviteDetail | null>(null)
  const error = ref<unknown>(null)
  const accepting = ref(false)
  const accepted = ref(false)
  const loginEmail = ref<string | null>(null)
  const verifyingPhone = ref(false)
  const completing = ref(false)
  const resendingCode = ref(false)

  async function fetchInvite(token: string) {
    error.value = null
    try {
      invite.value = await api<InviteDetail>(apiRoutes.invitations.detail(token), {
        query: { token },
        noSpace: true
      })
    } catch (e) {
      invite.value = null
      error.value = e
    }
  }

  async function verifyPhone(token: string, code: string) {
    verifyingPhone.value = true
    try {
      await api(apiRoutes.invitations.verifyPhone(token), {
        method: 'POST',
        body: { code },
        noSpace: true
      })
      if (invite.value) {
        invite.value.phoneVerified = true
        invite.value.requiresPhoneVerification = false
      }
      return true
    } finally {
      verifyingPhone.value = false
    }
  }

  async function resendPhoneCode(token: string) {
    resendingCode.value = true
    try {
      await api(apiRoutes.invitations.resendPhone(token), { method: 'POST', noSpace: true })
    } finally {
      resendingCode.value = false
    }
  }

  async function completeRegistration(
    token: string,
    body: { password: string, email?: string, name?: string }
  ) {
    completing.value = true
    try {
      const result = await api<{ spaceId: string, spaceName: string, loginEmail: string }>(
        apiRoutes.invitations.complete(token),
        { method: 'POST', body, noSpace: true }
      )
      await spacesStore.fetchSpaces()
      await spacesStore.switchSpace(result.spaceId)
      loginEmail.value = result.loginEmail
      accepted.value = true
      return result
    } finally {
      completing.value = false
    }
  }

  async function acceptInvite(token: string) {
    accepting.value = true
    try {
      const result = await api<{ spaceId: string, spaceName: string }>(
        apiRoutes.invitations.accept(token),
        { method: 'POST', noSpace: true }
      )
      await spacesStore.fetchSpaces()
      await spacesStore.switchSpace(result.spaceId)
      accepted.value = true
      return result
    } finally {
      accepting.value = false
    }
  }

  return {
    invite,
    error,
    accepting,
    accepted,
    loginEmail,
    verifyingPhone,
    completing,
    resendingCode,
    fetchInvite,
    verifyPhone,
    resendPhoneCode,
    completeRegistration,
    acceptInvite
  }
})
