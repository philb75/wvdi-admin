import { createClient } from '@/lib/supabase/client'
import type { Lookup, LookupFilters } from '@/types/lookup'

const supabase = createClient()

export async function getLookups(filters: LookupFilters) {
  let query = supabase
    .from('w_lookup')
    .select('*', { count: 'exact' })

  // Type filter
  if (filters.type !== 'All') {
    query = query.eq('type', filters.type)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('status', filters.status === 'A' ? 'active' : 'inactive')
  }

  // Search filter
  if (filters.search) {
    query = query.or(`type.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
  }

  // Sorting
  const sortColumn = filters.sort || 'type'
  const ascending = filters.sortDirection === 'asc'
  query = query.order(sortColumn, { ascending })

  // Secondary sort by list_order
  if (sortColumn !== 'list_order') {
    query = query.order('list_order', { ascending: true })
  }

  // Pagination
  const from = (filters.page - 1) * filters.items
  const to = from + filters.items - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching lookups:', error)
    throw error
  }

  return { data: data as Lookup[] || [], count: count || 0 }
}

export async function getTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('w_lookup')
    .select('type')
    .order('type')

  if (error) throw error

  // Get unique types
  const types = [...new Set((data || []).map(item => item.type).filter(Boolean))]
  return types as string[]
}

export async function getLookupById(id: number): Promise<Lookup | null> {
  const { data, error } = await supabase
    .from('w_lookup')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching lookup:', error)
    return null
  }

  return data
}

export async function createLookup(lookup: Partial<Lookup>): Promise<Lookup> {
  const { data, error } = await supabase
    .from('w_lookup')
    .insert({
      type: lookup.type,
      code: lookup.code,
      description: lookup.description,
      status: lookup.status ?? 'active',
      list_order: lookup.list_order || 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLookup(id: number, lookup: Partial<Lookup>): Promise<Lookup> {
  const { data, error } = await supabase
    .from('w_lookup')
    .update({
      type: lookup.type,
      code: lookup.code,
      description: lookup.description,
      status: lookup.status,
      list_order: lookup.list_order,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLookup(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_lookup')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteLookups(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_lookup')
    .delete()
    .in('id', ids)

  if (error) throw error
  return true
}
