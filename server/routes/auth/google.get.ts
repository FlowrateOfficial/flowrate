import { handleSocialOAuthRedirect } from '../../utils/socialOAuthRedirect'

export default defineEventHandler(event => handleSocialOAuthRedirect(event, 'google'))
