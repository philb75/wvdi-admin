// Contact types for WVDI

export interface Contact {
  id: number
  branch_id: number | null
  contact_type: string | null
  company: string | null
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  nick_name: string | null
  contact_status: string | null
  license_code: string | null
  referral_type: string | null
  email: string | null
  phone1: string | null
  phone2: string | null
  address1: string | null
  address2: string | null
  region: string | null
  city: string | null
  zip_code: string | null
  photo: string | null
  gender: string | null
  updated_by: number | null
  created_at: string
  updated_at: string

  // Joined fields
  branch_name?: string

  // Computed
  full_name?: string
}

export interface ContactFilters {
  search: string
  branch_id: number | 'All'
  contact_type: string | 'All'
  status: string | 'All'
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}
