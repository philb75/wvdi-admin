import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactFilters } from '@/types/contact'
import type { Branch } from '@/types/register'

const supabase = createClient()

export async function getContacts(filters: ContactFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_contacts')
    .select(`
      *,
      w_branches!w_contacts_branch_id_fkey (id, name)
    `, { count: 'exact' })

  // Branch filter
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  // Contact type filter
  if (filters.contact_type !== 'All') {
    query = query.eq('contact_type', filters.contact_type)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('contact_status', filters.status)
  }

  // Search filter
  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone1.ilike.%${filters.search}%`)
  }

  // Sorting
  const sortColumn = filters.sort || 'created_at'
  const ascending = filters.sortDirection === 'asc'
  query = query.order(sortColumn, { ascending })

  // Pagination
  const from = (filters.page - 1) * filters.items
  const to = from + filters.items - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching contacts:', error)
    throw error
  }

  // Transform data
  const contacts: Contact[] = (data || []).map((item: any) => ({
    ...item,
    branch_name: item.w_branches?.name || '',
    full_name: [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ')
  }))

  return { data: contacts, count: count || 0 }
}

export async function getContactById(id: number): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('w_contacts')
    .select(`
      *,
      w_branches!w_contacts_branch_id_fkey (id, name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching contact:', error)
    return null
  }

  return {
    ...data,
    branch_name: data.w_branches?.name || '',
    full_name: [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ')
  }
}

export async function createContact(contact: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from('w_contacts')
    .insert({
      branch_id: contact.branch_id,
      contact_type: contact.contact_type,
      company: contact.company,
      first_name: contact.first_name,
      middle_name: contact.middle_name,
      last_name: contact.last_name,
      nick_name: contact.nick_name,
      contact_status: contact.contact_status || 'A',
      license_code: contact.license_code,
      referral_type: contact.referral_type,
      email: contact.email,
      phone1: contact.phone1,
      phone2: contact.phone2,
      address1: contact.address1,
      address2: contact.address2,
      region: contact.region,
      city: contact.city,
      zip_code: contact.zip_code,
      gender: contact.gender,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContact(id: number, contact: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from('w_contacts')
    .update({
      branch_id: contact.branch_id,
      contact_type: contact.contact_type,
      company: contact.company,
      first_name: contact.first_name,
      middle_name: contact.middle_name,
      last_name: contact.last_name,
      nick_name: contact.nick_name,
      contact_status: contact.contact_status,
      license_code: contact.license_code,
      referral_type: contact.referral_type,
      email: contact.email,
      phone1: contact.phone1,
      phone2: contact.phone2,
      address1: contact.address1,
      address2: contact.address2,
      region: contact.region,
      city: contact.city,
      zip_code: contact.zip_code,
      gender: contact.gender,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteContact(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteContacts(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_contacts')
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

export async function getContactTypes(): Promise<string[]> {
  // Common contact types in WVDI
  return ['Vendor', 'Customer', 'Employee', 'Instructor', 'Other']
}
