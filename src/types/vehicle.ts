// Vehicle types for WVDI

export interface Vehicle {
  id: number
  branch_id: number | null
  brand: string | null
  model: string | null
  color: string | null
  plate_number: string | null
  start_date: string | null
  price_purchased: number | null
  end_date: string | null
  price_sold: number | null
  status: string | null
  updated_by: number | null
  created_at: string
  updated_at: string

  // Joined fields
  branch_name?: string

  // Computed
  full_name?: string
}

export interface VehicleFilters {
  search: string
  branch_id: number | 'All'
  status: string | 'All'
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}
