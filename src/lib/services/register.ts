import { createClient } from '@/lib/supabase/client'
import type { Register, RegisterFilters, WorkingBalance, Branch, Account, AccountCategory, Contact } from '@/types/register'

const supabase = createClient()

export async function getRegisters(filters: RegisterFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_register')
    .select(`
      *,
      w_branches!w_register_branch_id_fkey (id, name),
      w_accounts!w_register_account_id_fkey (id, account_name, account_category),
      w_account_categories!w_register_category_id_fkey (id, name, type),
      w_contacts!w_register_contact_id_fkey (id, first_name, last_name, nick_name, company),
      transfer_account:w_accounts!w_register_transfer_account_id_fkey (id, account_name)
    `)

  // Account filter
  if (filters.account_id && filters.account_id !== 'All') {
    query = query.eq('account_id', filters.account_id)
  }

  // Branch filter
  if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  // Date filters
  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  // Transaction status filters
  const statuses: string[] = []
  if (filters.showCleared) statuses.push('C')
  if (filters.showUncleared) statuses.push('U')
  if (filters.showReconciled) statuses.push('R')
  if (statuses.length > 0) {
    query = query.in('transaction_status', statuses)
  }

  // Search filter
  if (filters.search) {
    query = query.or(`memo.ilike.%${filters.search}%,check.ilike.%${filters.search}%,or_number.ilike.%${filters.search}%`)
  }

  // Contact filter
  if (filters.contact_id) {
    query = query.eq('contact_id', filters.contact_id)
  }

  // Sorting
  const sortColumn = filters.sort || 'date'
  const sortDirection = filters.sortDirection === 'asc'
  query = query.order(sortColumn.replace('w_register.', ''), { ascending: sortDirection })
  query = query.order('updated_at', { ascending: false })

  // Pagination
  const from = (filters.page - 1) * filters.items
  const to = from + filters.items - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching registers:', error)
    throw error
  }

  // Transform data
  const registers: Register[] = (data || []).map((item: any) => ({
    ...item,
    branch_name: item.w_branches?.name || '',
    account_name: item.w_accounts?.account_name || '',
    category_name: item.w_account_categories?.name || '',
    contact_name: item.w_contacts
      ? (item.w_contacts.company || `${item.w_contacts.first_name || ''} ${item.w_contacts.last_name || ''}`.trim() || item.w_contacts.nick_name || '')
      : '',
    transfer_account_name: item.transfer_account?.account_name || '',
    inflow: item.amount >= 0 ? item.amount : 0,
    outflow: item.amount < 0 ? Math.abs(item.amount) : 0,
  }))

  return { data: registers, count }
}

export async function getRegisterById(id: number) {
  const { data, error } = await supabase
    .from('w_register')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createRegister(register: Partial<Register>) {
  // Calculate amount from inflow/outflow
  const amount = (register.inflow || 0) - (register.outflow || 0)

  const { data, error } = await supabase
    .from('w_register')
    .insert({
      branch_id: register.branch_id,
      account_id: register.account_id,
      transfer_account_id: register.transfer_account_id,
      date: register.date,
      contact_id: register.contact_id,
      category_id: register.category_id,
      memo: register.memo,
      amount,
      transaction_status: 'U',
      check: register.check,
      or_number: register.or_number,
      transaction_type: register.transaction_type,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRegister(id: number, register: Partial<Register>) {
  // Calculate amount from inflow/outflow
  const amount = (register.inflow || 0) - (register.outflow || 0)

  const { data, error } = await supabase
    .from('w_register')
    .update({
      branch_id: register.branch_id,
      account_id: register.account_id,
      transfer_account_id: register.transfer_account_id,
      date: register.date,
      contact_id: register.contact_id,
      category_id: register.category_id,
      memo: register.memo,
      amount,
      check: register.check,
      or_number: register.or_number,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRegisters(ids: number[]) {
  const { error } = await supabase
    .from('w_register')
    .delete()
    .in('id', ids)

  if (error) throw error
  return true
}

export async function updateTransactionStatus(ids: number[], status: 'U' | 'C' | 'R') {
  const { error } = await supabase
    .from('w_register')
    .update({ transaction_status: status })
    .in('id', ids)
    .neq('transaction_status', 'R') // Don't update reconciled transactions

  if (error) throw error
  return true
}

export async function getWorkingBalance(accountId: number | string, branchIds?: number[]): Promise<WorkingBalance> {
  let clearedQuery = supabase
    .from('w_register')
    .select('amount')
    .in('transaction_status', ['C', 'R'])

  let unclearedQuery = supabase
    .from('w_register')
    .select('amount')
    .eq('transaction_status', 'U')

  if (accountId !== 'All') {
    clearedQuery = clearedQuery.eq('account_id', accountId)
    unclearedQuery = unclearedQuery.eq('account_id', accountId)
  }

  if (branchIds && branchIds.length > 0) {
    clearedQuery = clearedQuery.in('branch_id', branchIds)
    unclearedQuery = unclearedQuery.in('branch_id', branchIds)
  }

  const [clearedResult, unclearedResult] = await Promise.all([
    clearedQuery,
    unclearedQuery
  ])

  const cleared = (clearedResult.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  const uncleared = (unclearedResult.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)

  return {
    cleared,
    uncleared,
    working_balance: cleared + uncleared
  }
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

export async function getAccounts(): Promise<(Account & { category_name?: string })[]> {
  const { data, error } = await supabase
    .from('w_accounts')
    .select(`
      *,
      w_account_categories!w_accounts_account_category_fkey (id, name)
    `)
    .eq('status', 'A')
    .order('list_order')

  if (error) throw error

  // Map to include category_name
  return (data || []).map((item: any) => ({
    ...item,
    category_name: item.w_account_categories?.name || ''
  }))
}

export async function getAccountCategories(): Promise<AccountCategory[]> {
  const { data, error } = await supabase
    .from('w_account_categories')
    .select('*')
    .order('list_order')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('w_contacts')
    .select('id, company, first_name, last_name, nick_name, contact_type')
    .order('company')

  if (error) throw error
  return data || []
}
