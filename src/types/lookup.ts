// Lookup types for WVDI

export interface Lookup {
  id: number
  type: string | null
  code: string | null
  description: string | null
  status: string | null
  list_order: number | null
  created_at?: string
  updated_at?: string
}

export interface LookupFilters {
  search: string
  type: string | 'All'
  status: string | 'All'
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}
