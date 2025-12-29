import { createClient } from '@/lib/supabase/client'
import type { Requisition, RequisitionFilters, AccountCategory, Account } from '@/types/requisition'
import type { Branch } from '@/types/register'

const supabase = createClient()

export async function getRequisitions(filters: RequisitionFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_requisition')
    .select(`
      *,
      w_branches!w_requisition_branch_id_fkey (id, name),
      contact:w_contacts!w_requisition_contact_id_fkey (id, first_name, last_name)
    `, { count: 'exact' })

  // Branch filter
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  // Date filters
  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  // Category filter
  if (filters.category_id !== 'All') {
    query = query.eq('category_id', filters.category_id)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('status', filters.status)
  }

  // Search filter (search in reason, remarks, or_number)
  if (filters.search) {
    query = query.or(`reason.ilike.%${filters.search}%,remarks.ilike.%${filters.search}%,or_number.ilike.%${filters.search}%`)
  }

  // Sorting
  const sortColumn = filters.sort || 'date'
  const ascending = filters.sortDirection === 'asc'
  query = query.order(sortColumn, { ascending })

  // Pagination
  const from = (filters.page - 1) * filters.items
  const to = from + filters.items - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching requisitions:', error)
    throw error
  }

  // Transform data
  const requisitions: Requisition[] = (data || []).map((item: any) => ({
    ...item,
    branch_name: item.w_branches?.name || '',
    category_name: '',
    account_name: '',
    contact_name: item.contact
      ? [item.contact.first_name, item.contact.last_name].filter(Boolean).join(' ')
      : '',
    requestor_name: '',
    approver_name: ''
  }))

  return { data: requisitions, count: count || 0 }
}

export async function getRequisitionById(id: number): Promise<Requisition | null> {
  const { data, error } = await supabase
    .from('w_requisition')
    .select(`
      *,
      w_branches!w_requisition_branch_id_fkey (id, name),
      contact:w_contacts!w_requisition_contact_id_fkey (id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching requisition:', error)
    return null
  }

  return {
    ...data,
    branch_name: data.w_branches?.name || '',
    category_name: '',
    account_name: '',
    contact_name: data.contact
      ? [data.contact.first_name, data.contact.last_name].filter(Boolean).join(' ')
      : '',
    requestor_name: '',
    approver_name: ''
  }
}

export async function createRequisition(requisition: Partial<Requisition>, userId: number): Promise<Requisition> {
  const { data, error } = await supabase
    .from('w_requisition')
    .insert({
      date: requisition.date,
      branch_id: requisition.branch_id,
      category_id: requisition.category_id,
      account_id: requisition.account_id,
      contact_id: requisition.contact_id,
      or_number: requisition.or_number,
      check: requisition.check,
      actual: requisition.actual,
      reason: requisition.reason,
      amount: requisition.amount,
      status: requisition.status || 'Draft',
      remarks: requisition.remarks,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRequisition(id: number, requisition: Partial<Requisition>, userId: number): Promise<Requisition> {
  const updateData: any = {
    date: requisition.date,
    branch_id: requisition.branch_id,
    category_id: requisition.category_id,
    account_id: requisition.account_id,
    contact_id: requisition.contact_id,
    or_number: requisition.or_number,
    check: requisition.check,
    actual: requisition.actual,
    reason: requisition.reason,
    amount: requisition.amount,
    status: requisition.status,
    remarks: requisition.remarks,
    updated_by: userId,
  }

  // If approving, add approved_by and approved_at
  if (requisition.status === 'Approved' && requisition.approved_by) {
    updateData.approved_by = requisition.approved_by
    updateData.approved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('w_requisition')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRequisition(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_requisition')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteRequisitions(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_requisition')
    .delete()
    .in('id', ids)

  if (error) throw error
  return true
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

export async function getAccountCategories(): Promise<AccountCategory[]> {
  const { data, error } = await supabase
    .from('w_account_categories')
    .select('*')
    .eq('status', 'A')
    .order('category')

  if (error) throw error
  return data || []
}

export async function getAccounts(categoryId?: number): Promise<Account[]> {
  let query = supabase
    .from('w_accounts')
    .select('*')
    .eq('status', 'A')
    .order('account_name')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getVendors() {
  const { data, error } = await supabase
    .from('w_contacts')
    .select('id, first_name, last_name, company')
    .eq('contact_type', 'Vendor')
    .eq('contact_status', 'Active')
    .order('company')

  if (error) throw error
  return (data || []).map(c => ({
    id: c.id,
    name: c.company || [c.first_name, c.last_name].filter(Boolean).join(' ')
  }))
}

export async function getRequisitionStatuses(): Promise<string[]> {
  return ['Draft', 'Submitted', 'Approved', 'Paid', 'Cancelled']
}

export async function getRequisitionStats(branchIds?: number[]) {
  let query = supabase
    .from('w_requisition')
    .select('status, amount', { count: 'exact' })

  if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  const { data, count, error } = await query

  if (error) throw error

  const stats = {
    total: count || 0,
    totalAmount: 0,
    byStatus: {} as Record<string, { count: number, amount: number }>
  }

  ;(data || []).forEach((item: any) => {
    const status = item.status || 'Unknown'
    const amount = Number(item.amount) || 0
    stats.totalAmount += amount

    if (!stats.byStatus[status]) {
      stats.byStatus[status] = { count: 0, amount: 0 }
    }
    stats.byStatus[status].count++
    stats.byStatus[status].amount += amount
  })

  return stats
}
