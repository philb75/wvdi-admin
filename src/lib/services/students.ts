import { createClient } from '@/lib/supabase/client'
import type { Student, StudentFilters, Service } from '@/types/student'
import type { Branch } from '@/types/register'

const supabase = createClient()

export async function getStudents(filters: StudentFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_contacts')
    .select(`
      *,
      w_branches!w_contacts_branch_id_fkey (id, name)
    `, { count: 'exact' })
    .eq('contact_type', 'STUDENT')

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
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone1.ilike.%${filters.search}%,license_code.ilike.%${filters.search}%`)
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
    console.error('Error fetching students:', error)
    throw error
  }

  // Transform data
  const students: Student[] = (data || []).map((item: any) => ({
    ...item,
    branch_name: item.w_branches?.name || '',
    full_name: [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ')
  }))

  return { data: students, count: count || 0 }
}

export async function getStudentById(id: number): Promise<Student | null> {
  const { data, error } = await supabase
    .from('w_contacts')
    .select(`
      *,
      w_branches!w_contacts_branch_id_fkey (id, name)
    `)
    .eq('id', id)
    .eq('contact_type', 'STUDENT')
    .single()

  if (error) {
    console.error('Error fetching student:', error)
    return null
  }

  return {
    ...data,
    branch_name: data.w_branches?.name || '',
    full_name: [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ')
  }
}

export async function createStudent(student: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase
    .from('w_contacts')
    .insert({
      branch_id: student.branch_id,
      contact_type: 'STUDENT',
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      nick_name: student.nick_name,
      contact_status: student.contact_status || 'Active',
      license_code: student.license_code,
      referral_type: student.referral_type,
      email: student.email,
      phone1: student.phone1,
      phone2: student.phone2,
      address1: student.address1,
      address2: student.address2,
      region: student.region,
      city: student.city,
      zip_code: student.zip_code,
      gender: student.gender,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStudent(id: number, student: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase
    .from('w_contacts')
    .update({
      branch_id: student.branch_id,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      nick_name: student.nick_name,
      contact_status: student.contact_status,
      license_code: student.license_code,
      referral_type: student.referral_type,
      email: student.email,
      phone1: student.phone1,
      phone2: student.phone2,
      address1: student.address1,
      address2: student.address2,
      region: student.region,
      city: student.city,
      zip_code: student.zip_code,
      gender: student.gender,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStudent(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_contacts')
    .delete()
    .eq('id', id)
    .eq('contact_type', 'STUDENT')

  if (error) throw error
  return true
}

export async function deleteStudents(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_contacts')
    .delete()
    .in('id', ids)
    .eq('contact_type', 'STUDENT')

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

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('w_services')
    .select('*')
    .eq('status', 'A')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getStudentStatuses(): Promise<string[]> {
  return ['Active', 'Pending', 'Completed', 'Inactive']
}
