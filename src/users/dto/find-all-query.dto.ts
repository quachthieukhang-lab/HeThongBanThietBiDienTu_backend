import { UserRole, UserStatus } from '@users/schemas/user.schema'

export type FindAllQuery = {
  page?: number
  limit?: number
  search?: string
  status?: UserStatus
  roles?: UserRole[]
}
