// Register types for WVDI Finance module

export interface Register {
  id: number
  branch_id: number | null
  account_id: number | null
  transaction_type: string | null
  transfer_account_id: number | null
  transfer_register_id: number | null
  flag: string | null
  date: string
  contact_id: number | null
  payment_method: string | null
  category_id: number | null
  service_id: number | null
  memo: string | null
  certificate_no: string | null
  amount: number
  transaction_status: 'U' | 'C' | 'R' // Uncleared, Cleared, Reconciled
  or_number: string | null
  check: string | null
  requisition_id: number | null
  updated_by: number | null
  created_at: string
  updated_at: string

  // Joined fields
  branch_name?: string
  account_name?: string
  category_name?: string
  contact_name?: string
  transfer_account_name?: string

  // Computed fields
  inflow?: number
  outflow?: number
  toggleEdit?: boolean
  checked?: boolean
}

export interface Branch {
  id: number
  name: string
  branch_code: string
  status: 'A' | 'I'
}

export interface Account {
  id: number
  account_name: string
  account_category: number | null
  account_type: string
  status: 'A' | 'I'
  list_order: number | null
}

export interface AccountCategory {
  id: number
  name: string
  type: 'income' | 'expense' | 'asset'
  revenue_type: string | null
  parent_id: number | null
  list_order: number | null
}

export interface Contact {
  id: number
  company: string | null
  first_name: string | null
  last_name: string | null
  nick_name: string | null
  contact_type: string | null
}

export interface RegisterFilters {
  sort: string | null
  sortDirection: 'asc' | 'desc'
  search: string
  account_id: number | string
  date_from: string | null
  date_to: string | null
  showReconciled: boolean
  showCleared: boolean
  showUncleared: boolean
  dateFilter: string
  contact_id?: number | null
  page: number
  items: number
}

export interface WorkingBalance {
  cleared: number
  uncleared: number
  working_balance: number
}

export interface RegisterDropdown {
  branches: Branch[]
  accounts: Account[]
  categories: AccountCategory[]
  contacts: Contact[]
}
