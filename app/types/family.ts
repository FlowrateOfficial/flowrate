// ANCHOR: Family space types — re-export shared API contracts
export type {
  ChildProfileDto,
  MemberFinancialDto,
  SpaceDetailDto,
  SpaceDetailMemberDto
} from '#shared/api/family'

import type {
  MemberFinancialDto,
  SpaceDetailDto,
  SpaceDetailMemberDto
} from '#shared/api/family'

export type SpaceDetailMember = SpaceDetailMemberDto
export type SpaceDetail = SpaceDetailDto
export type MemberFinancial = MemberFinancialDto
