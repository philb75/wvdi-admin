import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/register'

const supabase = createClient()

export interface ExportFilters {
  date_from: string
  date_to: string
  branch_id: number | 'All'
}

export async function getRegisterData(filters: ExportFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_register')
    .select(`
      id,
      date,
      type,
      amount,
      cash,
      bank,
      gcash,
      check,
      status,
      created_at,
      w_branches!w_register_branch_id_fkey (name),
      w_contacts!w_register_contact_id_fkey (first_name, last_name, company),
      w_services!w_register_service_id_fkey (service),
      w_accounts!w_register_account_id_fkey (account_name),
      w_users!w_register_created_by_fkey (name)
    `)

  // Apply filters
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  query = query.order('date', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((item: any) => ({
    id: item.id,
    date: item.date,
    branch: item.w_branches?.name || '',
    type: item.type,
    contact: item.w_contacts
      ? item.w_contacts.company || `${item.w_contacts.first_name || ''} ${item.w_contacts.last_name || ''}`.trim()
      : '',
    service: item.w_services?.service || '',
    account: item.w_accounts?.account_name || '',
    amount: item.amount,
    cash: item.cash,
    bank: item.bank,
    gcash: item.gcash,
    check: item.check,
    status: item.status,
    created_by: item.w_users?.name || '',
    created_at: item.created_at
  }))
}

export async function getStudentsData(filters: ExportFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_contacts')
    .select(`
      id,
      first_name,
      middle_name,
      last_name,
      nick_name,
      gender,
      birthday,
      phone1,
      phone2,
      email,
      address1,
      address2,
      city,
      region,
      zip_code,
      contact_status,
      created_at,
      w_branches!w_contacts_branch_id_fkey (name)
    `)
    .eq('contact_type', 'Student')

  // Apply branch filter
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  query = query.order('last_name', { ascending: true })

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((item: any) => ({
    id: item.id,
    branch: item.w_branches?.name || '',
    first_name: item.first_name,
    middle_name: item.middle_name,
    last_name: item.last_name,
    nick_name: item.nick_name,
    gender: item.gender,
    birthday: item.birthday,
    phone1: item.phone1,
    phone2: item.phone2,
    email: item.email,
    address: [item.address1, item.address2].filter(Boolean).join(', '),
    city: item.city,
    region: item.region,
    zip_code: item.zip_code,
    status: item.contact_status,
    created_at: item.created_at
  }))
}

export async function getRequisitionsData(filters: ExportFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_requisition')
    .select(`
      id,
      date,
      or_number,
      check,
      actual,
      reason,
      amount,
      status,
      remarks,
      approved_at,
      created_at,
      w_branches!w_requisition_branch_id_fkey (name),
      contact:w_contacts!w_requisition_contact_id_fkey (first_name, last_name, company)
    `)

  // Apply filters
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  query = query.order('date', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((item: any) => ({
    id: item.id,
    date: item.date,
    branch: item.w_branches?.name || '',
    or_number: item.or_number,
    check: item.check,
    actual: item.actual,
    category: '',
    account: '',
    vendor: item.contact
      ? item.contact.company || `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()
      : '',
    reason: item.reason,
    amount: item.amount,
    status: item.status,
    remarks: item.remarks,
    requestor: '',
    approver: '',
    approved_at: item.approved_at,
    created_at: item.created_at
  }))
}

export async function getBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('w_branches')
    .select('*')
    .eq('status', 'A')
    .order('name')

  if (error) throw error
  return data || []
}
