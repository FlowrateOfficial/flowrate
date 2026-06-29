import type { ActiveSpace } from '~/types/space'

export function defaultDashboardPath(space: ActiveSpace): string {
  return space.type === 'COMPANY' ? '/dashboard/company' : '/dashboard'
}

export function resolvePathAfterSpaceSwitch(path: string, space: ActiveSpace): string {
  if (path.startsWith('/dashboard/company') && space.type !== 'COMPANY') {
    return '/dashboard'
  }

  if (path.startsWith('/dashboard/family') && space.type !== 'HOUSEHOLD' && space.type !== 'FAMILY') {
    return '/dashboard'
  }

  if (path === '/dashboard' && space.type === 'COMPANY') {
    return '/dashboard/company'
  }

  return path
}
