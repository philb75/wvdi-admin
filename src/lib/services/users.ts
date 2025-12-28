import { createClient } from '@/lib/supabase/client'
import type { User, UserFilters, CreateUserData, UserBranch } from '@/types/user'

const supabase = createClient()

export async function getUsers(filters: UserFilters) {
  // First get users
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })

  // Role filter
  if (filters.role !== 'All') {
    query = query.eq('role', filters.role)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('is_active', filters.status === 'Active')
  }

  // Search filter
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
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
    console.error('Error fetching users:', error)
    throw error
  }

  // Fetch user branches for each user
  const users = data as User[] || []
  if (users.length > 0) {
    const userIds = users.map(u => u.id)
    const { data: branchesData } = await supabase
      .from('user_branches')
      .select(`
        id,
        user_id,
        branch_id,
        branches:branch_id (
          id,
          branch_name
        )
      `)
      .in('user_id', userIds)

    // Attach branches to users
    const branchesMap = new Map<string, UserBranch[]>()
    ;(branchesData || []).forEach((ub: any) => {
      const branch: UserBranch = {
        id: ub.id,
        user_id: ub.user_id,
        branch_id: ub.branch_id,
        branch_name: ub.branches?.branch_name
      }
      if (!branchesMap.has(ub.user_id)) {
        branchesMap.set(ub.user_id, [])
      }
      branchesMap.get(ub.user_id)!.push(branch)
    })

    users.forEach(user => {
      user.branches = branchesMap.get(user.id) || []
    })
  }

  return { data: users, count: count || 0 }
}

export async function getRoles(): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('role')

  if (error) throw error

  // Get unique roles
  const roles = [...new Set((data || []).map(item => item.role).filter(Boolean))]
  return roles as string[]
}

export async function getBranches(): Promise<{ id: number; branch_name: string }[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, branch_name')
    .order('branch_name')

  if (error) throw error
  return data || []
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  // Also get branches
  const { data: branchesData } = await supabase
    .from('user_branches')
    .select(`
      id,
      user_id,
      branch_id,
      branches:branch_id (
        id,
        branch_name
      )
    `)
    .eq('user_id', id)

  const user = data as User
  user.branches = (branchesData || []).map((ub: any) => ({
    id: ub.id,
    user_id: ub.user_id,
    branch_id: ub.branch_id,
    branch_name: ub.branches?.branch_name
  }))

  return user
}

export async function createUser(userData: CreateUserData): Promise<User> {
  // First create auth user via edge function or admin API
  // For now, we'll just create the user record in the users table
  // In production, you'd use Supabase Admin API to create auth user

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error

  // Add user branches
  if (userData.branch_ids && userData.branch_ids.length > 0) {
    const branchInserts = userData.branch_ids.map(branch_id => ({
      user_id: data.id,
      branch_id
    }))

    await supabase
      .from('user_branches')
      .insert(branchInserts)
  }

  return data
}

export async function updateUser(id: string, userData: Partial<User & { branch_ids?: number[] }>): Promise<User> {
  const { branch_ids, branches, ...updateData } = userData

  const { data, error } = await supabase
    .from('users')
    .update({
      name: updateData.name,
      role: updateData.role,
      is_active: updateData.is_active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Update user branches if provided
  if (branch_ids !== undefined) {
    // Delete existing branches
    await supabase
      .from('user_branches')
      .delete()
      .eq('user_id', id)

    // Insert new branches
    if (branch_ids.length > 0) {
      const branchInserts = branch_ids.map(branch_id => ({
        user_id: id,
        branch_id
      }))

      await supabase
        .from('user_branches')
        .insert(branchInserts)
    }
  }

  return data
}

export async function deleteUser(id: string): Promise<boolean> {
  // First delete user branches
  await supabase
    .from('user_branches')
    .delete()
    .eq('user_id', id)

  // Then delete user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteUsers(ids: string[]): Promise<boolean> {
  // First delete user branches
  await supabase
    .from('user_branches')
    .delete()
    .in('user_id', ids)

  // Then delete users
  const { error } = await supabase
    .from('users')
    .delete()
    .in('id', ids)

  if (error) throw error
  return true
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
  let query = supabase
    .from('users')
    .select('id')
    .eq('email', email)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error
  return (data?.length || 0) > 0
}
