// ANCHOR: Family space types — re-export shared API contracts
import type {
  MemberFinancialDto,
  SpaceDetailDto,
  SpaceDetailMemberDto
} from '#shared/api/family'

export type {
  ChildProfileDto,
  MemberFinancialDto,
  SpaceDetailDto,
  SpaceDetailMemberDto
} from '#shared/api/family'

export type SpaceDetailMember = SpaceDetailMemberDto
export type SpaceDetail = SpaceDetailDto
export type MemberFinancial = MemberFinancialDto
