// Database types based on Laravel models
// Tables use w_ prefix in MySQL, will be migrated to PostgreSQL without prefix

export interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string
  created_at: string
  updated_at: string
  // Relations
  roles?: Role[]
  permissions?: Permission[]
  branches?: UserBranch[]
}

export interface Role {
  id: number
  name: string
  slug: string
  description?: string
  level?: number
  created_at: string
  updated_at: string
}

export interface Permission {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Branch {
  id: number
  name: string
  email?: string
  phone1?: string
  phone2?: string
  address1?: string
  address2?: string
  region?: string
  city?: string
  zip_code?: string
  place_id?: string
  permission?: string
  status?: string
  created_at: string
  updated_at: string
}

export interface UserBranch {
  id: number
  user_id: number
  branch_id: number
  created_at: string
  updated_at: string
}

export interface Account {
  id: number
  account_name: string
  account_type: 'Cash' | 'Bank' | 'AR' | 'AP' | 'Other'
  status?: string
  account_category?: number
  list_order?: number
  created_at: string
  updated_at: string
}

export interface AccountCategory {
  id: number
  name: string
  type?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  branch_id?: number
  contact_type?: 'Student' | 'Vendor' | 'Employee' | 'Customer'
  company?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  nick_name?: string
  contact_status?: string
  license_code?: string
  referral_type?: string
  email?: string
  phone1?: string
  phone2?: string
  address1?: string
  address2?: string
  region?: string
  city?: string
  zip_code?: string
  photo?: string
  gender?: string
  updated_by?: number
  created_at: string
  updated_at: string
}

export interface Register {
  id: number
  branch_id?: number
  account_id?: number
  transaction_type?: 'Inflow' | 'Outflow' | 'Transfer'
  transfer_account_id?: number
  transfer_register_id?: number
  flag?: string
  date?: string
  contact_id?: number
  payment_method?: string
  category_id?: number
  service_id?: number
  memo?: string
  certificate_no?: string
  amount: number
  transaction_status: 'C' | 'U' // Cleared or Uncleared
  or_number?: string
  check?: string
  requisition_id?: number
  updated_by?: number
  created_at: string
  updated_at: string
  // Relations (for joined queries)
  account?: Account
  branch?: Branch
  contact?: Contact
  category?: AccountCategory
  service?: Service
}

export interface Requisition {
  id: number
  branch_id?: number
  contact_id?: number
  date?: string
  amount: number
  memo?: string
  status: 'Draft' | 'Submitted' | 'Approved' | 'Disapproved' | 'Paid'
  approved_by?: number
  paid_by?: number
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: number
  name: string
  description?: string
  price?: number
  status?: string
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: number
  branch_id?: number
  contact_id?: number
  service_id?: number
  vehicle_id?: number
  room_id?: number
  instructor_id?: number
  date?: string
  start_time?: string
  end_time?: string
  status?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: number
  branch_id?: number
  name: string
  plate_number?: string
  type?: string
  status?: string
  created_at: string
  updated_at: string
}

export interface Room {
  id: number
  branch_id?: number
  name: string
  capacity?: number
  status?: string
  created_at: string
  updated_at: string
}

export interface Lookup {
  id: number
  type: string
  code: string
  description: string
  status?: string
  list_order?: number
  created_at: string
  updated_at: string
}

// Dashboard types
export interface SalesData {
  date: string
  branch_name: string
  amount: number
}

export interface RequisitionData {
  date: string
  status: string
  amount: number
}

export interface AccountBalance {
  account_id: number
  account_name: string
  cleared: number
  uncleared: number
  working_balance: number
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface WorkingBalance {
  cleared: number
  uncleared: number
  working_balance: number
}
