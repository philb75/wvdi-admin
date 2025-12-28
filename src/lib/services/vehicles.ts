import { createClient } from '@/lib/supabase/client'
import type { Vehicle, VehicleFilters } from '@/types/vehicle'
import type { Branch } from '@/types/register'

const supabase = createClient()

export async function getVehicles(filters: VehicleFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_vehicles')
    .select(`
      *,
      w_branches!w_vehicles_branch_id_fkey (id, name)
    `, { count: 'exact' })

  // Branch filter
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('status', filters.status)
  }

  // Search filter
  if (filters.search) {
    query = query.or(`brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,color.ilike.%${filters.search}%,plate_number.ilike.%${filters.search}%`)
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
    console.error('Error fetching vehicles:', error)
    throw error
  }

  // Transform data
  const vehicles: Vehicle[] = (data || []).map((item: any) => ({
    ...item,
    branch_name: item.w_branches?.name || '',
    full_name: [item.color, item.brand, item.model].filter(Boolean).join(' ')
  }))

  return { data: vehicles, count: count || 0 }
}

export async function getVehicleById(id: number): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('w_vehicles')
    .select(`
      *,
      w_branches!w_vehicles_branch_id_fkey (id, name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehicle:', error)
    return null
  }

  return {
    ...data,
    branch_name: data.w_branches?.name || '',
    full_name: [data.color, data.brand, data.model].filter(Boolean).join(' ')
  }
}

export async function createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('w_vehicles')
    .insert({
      branch_id: vehicle.branch_id,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      plate_number: vehicle.plate_number,
      start_date: vehicle.start_date,
      price_purchased: vehicle.price_purchased,
      end_date: vehicle.end_date,
      price_sold: vehicle.price_sold,
      status: vehicle.status || 'A',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('w_vehicles')
    .update({
      branch_id: vehicle.branch_id,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      plate_number: vehicle.plate_number,
      start_date: vehicle.start_date,
      price_purchased: vehicle.price_purchased,
      end_date: vehicle.end_date,
      price_sold: vehicle.price_sold,
      status: vehicle.status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteVehicle(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_vehicles')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteVehicles(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_vehicles')
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

export async function getVehicleStatuses(): Promise<string[]> {
  return ['A', 'I', 'S'] // Active, Inactive, Sold
}
