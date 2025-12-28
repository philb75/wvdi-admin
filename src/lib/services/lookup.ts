import { createClient } from '@/lib/supabase/client'
import type { Lookup, LookupFilters } from '@/types/lookup'

const supabase = createClient()

export async function getLookups(filters: LookupFilters) {
  let query = supabase
    .from('w_lookup')
    .select('*', { count: 'exact' })

  // Category filter
  if (filters.category !== 'All') {
    query = query.eq('category', filters.category)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('is_active', filters.status === 'A')
  }

  // Search filter
  if (filters.search) {
    query = query.or(`category.ilike.%${filters.search}%,value.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
  }

  // Sorting
  const sortColumn = filters.sort || 'category'
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

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('w_lookup')
    .select('category')
    .order('category')

  if (error) throw error

  // Get unique categories
  const categories = [...new Set((data || []).map(item => item.category).filter(Boolean))]
  return categories as string[]
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
      category: lookup.category,
      value: lookup.value,
      code: lookup.code,
      is_active: lookup.is_active ?? true,
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
      category: lookup.category,
      value: lookup.value,
      code: lookup.code,
      is_active: lookup.is_active,
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
