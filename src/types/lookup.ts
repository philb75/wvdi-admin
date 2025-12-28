// Lookup types for WVDI

export interface Lookup {
  id: number
  category: string | null
  value: string | null
  code: string | null
  is_active: boolean | null
  list_order: number | null
}

export interface LookupFilters {
  search: string
  category: string | 'All'
  status: string | 'All'
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}
