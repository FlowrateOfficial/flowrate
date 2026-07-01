import { runManualSpaceSync } from '../../lib/sync/manual'

export default defineEventHandler(async event => runManualSpaceSync(event))
