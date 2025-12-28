// Service types for WVDI

export interface Service {
  id: number
  service_code: string | null
  description: string | null
  price: number | null
  update_date: string | null
  status: string | null
  updated_by: number | null
  created_at: string
  updated_at: string
}

export interface ServiceFilters {
  search: string
  status: string | 'All'
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}
