// Requisition types for WVDI

export interface Requisition {
  id: number
  date: string | null
  branch_id: number | null
  category_id: number | null
  account_id: number | null
  contact_id: number | null
  or_number: string | null
  check: string | null
  actual: string | null
  reason: string | null
  amount: number | null
  status: string | null
  status_date: string | null
  remarks: string | null
  created_by: number | null
  updated_by: number | null
  approved_by: number | null
  approved_at: string | null
  created_at: string
  updated_at: string

  // Joined fields
  branch_name?: string
  category_name?: string
  account_name?: string
  contact_name?: string
  requestor_name?: string
  approver_name?: string
}

export interface RequisitionFilters {
  date_from: string
  date_to: string
  branch_id: number | 'All'
  status: string | 'All'
  category_id: number | 'All'
  search: string
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}

export interface AccountCategory {
  id: number
  category: string
  type: string
  status: string
}

export interface Account {
  id: number
  account_name: string
  category_id: number | null
  status: string
}
