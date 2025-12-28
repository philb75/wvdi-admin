// User types for WVDI

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  last_sign_in_at: string | null

  // Joined fields
  branches?: UserBranch[]
}

export interface UserBranch {
  id: number
  user_id: string
  branch_id: number
  branch_name?: string
}

export interface UserFilters {
  search: string
  role: string | 'All'
  status: string | 'All'
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role?: string
  branch_ids?: number[]
}
