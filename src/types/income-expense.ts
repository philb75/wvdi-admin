// Income vs Expense Report types for WVDI

export interface IncomeExpenseFilters {
  date_from: string
  date_to: string
  branches: number[]
  accounts: number[]
  categories: number[]
  uncategorized: boolean
}

export interface CategoryData {
  category: string
  data: number[]  // Monthly amounts
  modal: Transaction[][]  // Transactions per month
  all_modal: Transaction[]  // All transactions
  average: number
  total: number
  is_category: boolean
  sub_category?: CategoryData[]
}

export interface Transaction {
  id: number
  date: string
  memo: string | null
  amount: number
  inflow: number
  outflow: number
  branch_name: string | null
  account_name: string | null
  contact_name: string | null
  category_id: number | null
  service_code: string | null
  transfer: string | null
}

export interface IncomeExpenseReport {
  income: CategoryData[]
  expense: CategoryData[]
  others: CategoryData[]
  net_total: CategoryData
  headers: string[]  // Month headers like "Jan 2024", "Feb 2024"
}

export interface AccountCategoryGroup {
  name: string
  sub_categories: { id: number; type: string }[]
  isSelected: boolean
  selected_sub_categories: number[]
}

export interface CategoryFilterData {
  income: AccountCategoryGroup[]
  expense: AccountCategoryGroup[]
  other: AccountCategoryGroup[]
}

export interface BranchOption {
  id: number
  name: string
}

export interface AccountOption {
  id: number
  account_name: string
}

export interface AccountCategory {
  id: number
  name: string
  type: string
  revenue_type: 'R' | 'E' | null  // R = Revenue/Income, E = Expense, null = Other/Assets
  parent_id: number | null
}
