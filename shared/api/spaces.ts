// ANCHOR: Space list API contract

export interface UserSpaceListItemDto {
  id: string
  name: string
  type: string
  role: string
  memberCount: number
  accountCount: number
  isOwner: boolean
}

export interface UserSpacesResponseDto {
  spaceId: string | null
  spaces: UserSpaceListItemDto[]
}

export interface ActiveSpaceResponseDto {
  id: string
  name: string
  type: string
  role: string
  memberCount: number
}
