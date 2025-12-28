import { createClient } from '@/lib/supabase/client'
import type { Service, ServiceFilters } from '@/types/service'

const supabase = createClient()

export async function getServices(filters: ServiceFilters) {
  let query = supabase
    .from('w_services')
    .select('*', { count: 'exact' })

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('status', filters.status)
  }

  // Search filter
  if (filters.search) {
    query = query.or(`service_code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
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
    console.error('Error fetching services:', error)
    throw error
  }

  return { data: data as Service[] || [], count: count || 0 }
}

export async function getServiceById(id: number): Promise<Service | null> {
  const { data, error } = await supabase
    .from('w_services')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching service:', error)
    return null
  }

  return data
}

export async function createService(service: Partial<Service>): Promise<Service> {
  const { data, error } = await supabase
    .from('w_services')
    .insert({
      service_code: service.service_code,
      description: service.description,
      price: service.price,
      status: service.status || 'A',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateService(id: number, service: Partial<Service>): Promise<Service> {
  const { data, error } = await supabase
    .from('w_services')
    .update({
      service_code: service.service_code,
      description: service.description,
      price: service.price,
      status: service.status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteService(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_services')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteServices(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_services')
    .delete()
    .in('id', ids)

  if (error) throw error
  return true
}

export async function checkServiceCodeExists(code: string, excludeId?: number): Promise<boolean> {
  let query = supabase
    .from('w_services')
    .select('id')
    .eq('service_code', code)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error
  return (data?.length || 0) > 0
}
