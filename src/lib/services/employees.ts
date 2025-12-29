import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactFilters } from '@/types/contact'
import type { Branch } from '@/types/register'

const supabase = createClient()

export async function getEmployees(filters: ContactFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_contacts')
    .select(`
      *,
      w_branches!w_contacts_branch_id_fkey (id, name)
    `, { count: 'exact' })
    // Always filter for employees only
    .eq('contact_type', 'EMPLOYEE')

  // Branch filter
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('contact_status', filters.status)
  }

  // Search filter
  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,nick_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone1.ilike.%${filters.search}%`)
  }

  // Sorting
  const sortColumn = filters.sort || 'last_name'
  const ascending = filters.sortDirection === 'asc'
  query = query.order(sortColumn, { ascending })

  // Pagination
  const from = (filters.page - 1) * filters.items
  const to = from + filters.items - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching employees:', error)
    throw error
  }

  // Transform data
  const employees: Contact[] = (data || []).map((item: any) => ({
    ...item,
    branch_name: item.w_branches?.name || '',
    full_name: [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ')
  }))

  return { data: employees, count: count || 0 }
}

export async function getEmployeeById(id: number): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('w_contacts')
    .select(`
      *,
      w_branches!w_contacts_branch_id_fkey (id, name)
    `)
    .eq('id', id)
    .eq('contact_type', 'EMPLOYEE')
    .single()

  if (error) {
    console.error('Error fetching employee:', error)
    return null
  }

  return {
    ...data,
    branch_name: data.w_branches?.name || '',
    full_name: [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ')
  }
}

export async function createEmployee(employee: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from('w_contacts')
    .insert({
      branch_id: employee.branch_id,
      contact_type: 'EMPLOYEE',
      first_name: employee.first_name,
      middle_name: employee.middle_name,
      last_name: employee.last_name,
      nick_name: employee.nick_name,
      contact_status: employee.contact_status || 'Active',
      license_code: employee.license_code,
      email: employee.email,
      phone1: employee.phone1,
      phone2: employee.phone2,
      address1: employee.address1,
      address2: employee.address2,
      region: employee.region,
      city: employee.city,
      zip_code: employee.zip_code,
      gender: employee.gender,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEmployee(id: number, employee: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from('w_contacts')
    .update({
      branch_id: employee.branch_id,
      first_name: employee.first_name,
      middle_name: employee.middle_name,
      last_name: employee.last_name,
      nick_name: employee.nick_name,
      contact_status: employee.contact_status,
      license_code: employee.license_code,
      email: employee.email,
      phone1: employee.phone1,
      phone2: employee.phone2,
      address1: employee.address1,
      address2: employee.address2,
      region: employee.region,
      city: employee.city,
      zip_code: employee.zip_code,
      gender: employee.gender,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEmployee(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_contacts')
    .delete()
    .eq('id', id)
    .eq('contact_type', 'EMPLOYEE')

  if (error) throw error
  return true
}

export async function deleteEmployees(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_contacts')
    .delete()
    .in('id', ids)
    .eq('contact_type', 'EMPLOYEE')

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

export async function getEmployeeStats(branchIds?: number[]) {
  let query = supabase
    .from('w_contacts')
    .select('branch_id, contact_status', { count: 'exact' })
    .eq('contact_type', 'EMPLOYEE')

  if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  const { data, count, error } = await query

  if (error) throw error

  const stats = {
    total: count || 0,
    active: 0,
    inactive: 0,
    byBranch: {} as Record<number, number>
  }

  ;(data || []).forEach((item: any) => {
    if (item.contact_status === 'Active') {
      stats.active++
    } else {
      stats.inactive++
    }
    if (item.branch_id) {
      stats.byBranch[item.branch_id] = (stats.byBranch[item.branch_id] || 0) + 1
    }
  })

  return stats
}
