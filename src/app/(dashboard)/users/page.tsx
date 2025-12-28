'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getUsers,
  getRoles,
  getBranches,
  createUser,
  updateUser,
  deleteUser,
  deleteUsers,
  toggleUserStatus,
  checkEmailExists
} from '@/lib/services/users'
import type { User, UserFilters, CreateUserData } from '@/types/user'

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  )
}

// User Avatar Component
function UserAvatar({ name, email, size = 'md' }: { name: string | null; email: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email[0].toUpperCase()

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  // Generate color based on email
  const colors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-purple-400 to-purple-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-cyan-400 to-cyan-600',
    'from-indigo-400 to-indigo-600',
  ]
  const colorIndex = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-semibold shadow-sm`}>
      {initials}
    </div>
  )
}

// Role Badge Component
function RoleBadge({ role }: { role: string | null }) {
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    manager: 'bg-blue-100 text-blue-700 border-blue-200',
    user: 'bg-slate-100 text-slate-700 border-slate-200',
    staff: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    instructor: 'bg-amber-100 text-amber-700 border-amber-200',
  }

  const displayRole = role || 'user'
  const colorClass = roleColors[displayRole.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${colorClass}`}>
      {displayRole}
    </span>
  )
}

// User Modal Component
function UserModal({
  isOpen,
  onClose,
  onSave,
  user,
  roles,
  branches
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateUserData | Partial<User & { branch_ids?: number[] }>) => void
  user?: User | null
  roles: string[]
  branches: { id: number; branch_name: string }[]
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user',
    branch_ids: [] as number[],
    is_active: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        name: user.name || '',
        role: user.role || 'user',
        branch_ids: user.branches?.map(b => b.branch_id) || [],
        is_active: user.is_active
      })
    } else {
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'user',
        branch_ids: [],
        is_active: true
      })
    }
    setErrors({})
  }, [user, isOpen])

  const validate = async () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    } else {
      const exists = await checkEmailExists(formData.email, user?.id)
      if (exists) {
        newErrors.email = 'Email already exists'
      }
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Password is required for new users'
    } else if (!user && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const isValid = await validate()
    if (!isValid) {
      setSaving(false)
      return
    }

    if (user) {
      onSave({
        name: formData.name,
        role: formData.role,
        branch_ids: formData.branch_ids,
        is_active: formData.is_active
      })
    } else {
      onSave({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        branch_ids: formData.branch_ids
      })
    }
  }

  const handleBranchToggle = (branchId: number) => {
    setFormData(prev => ({
      ...prev,
      branch_ids: prev.branch_ids.includes(branchId)
        ? prev.branch_ids.filter(id => id !== branchId)
        : [...prev.branch_ids, branchId]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {user ? 'Update user information' : 'Create a new system user'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!user}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
              } ${user ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password (only for new users) */}
          {!user && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Minimum 6 characters"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              {roles.length > 0 ? (
                roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))
              ) : (
                <>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="instructor">Instructor</option>
                </>
              )}
            </select>
          </div>

          {/* Branches */}
          {branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Branches
              </label>
              <div className="border border-slate-300 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                {branches.map(branch => (
                  <label key={branch.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.branch_ids.includes(branch.id)}
                      onChange={() => handleBranchToggle(branch.id)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">{branch.branch_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Status (only for edit) */}
          {user && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-slate-700">Active User</span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 font-medium transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Confirmation Modal
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  count
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
          Delete {count === 1 ? 'User' : `${count} Users`}?
        </h3>
        <p className="text-slate-500 text-center mb-6">
          This action cannot be undone. The {count === 1 ? 'user' : 'users'} will be permanently removed from the system.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [roles, setRoles] = useState<string[]>([])
  const [branches, setBranches] = useState<{ id: number; branch_name: string }[]>([])

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'All',
    status: 'All',
    page: 1,
    items: 10,
    sort: 'created_at',
    sortDirection: 'desc'
  })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([])

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, admins: 0 })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await getUsers(filters)
      setUsers(data)
      setTotalCount(count)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchOptions = useCallback(async () => {
    try {
      const [rolesData, branchesData] = await Promise.all([
        getRoles(),
        getBranches()
      ])
      setRoles(rolesData)
      setBranches(branchesData)
    } catch (error) {
      console.error('Failed to fetch options:', error)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const [allUsers, activeUsers] = await Promise.all([
        getUsers({ ...filters, page: 1, items: 1000, status: 'All', role: 'All', search: '' }),
        getUsers({ ...filters, page: 1, items: 1000, status: 'Active', role: 'All', search: '' })
      ])

      const admins = allUsers.data.filter(u => u.role?.toLowerCase() === 'admin').length

      setStats({
        total: allUsers.count,
        active: activeUsers.count,
        inactive: allUsers.count - activeUsers.count,
        admins
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchOptions()
    fetchStats()
  }, [fetchOptions, fetchStats])

  const totalPages = Math.ceil(totalCount / filters.items)

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sort: column,
      sortDirection: prev.sort === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  const handleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map(u => u.id)))
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleAddNew = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleSave = async (data: CreateUserData | Partial<User & { branch_ids?: number[] }>) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data)
      } else {
        await createUser(data as CreateUserData)
      }
      setIsModalOpen(false)
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('Failed to save user:', error)
    }
  }

  const handleDelete = (ids: string[]) => {
    setDeleteTargetIds(ids)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    try {
      if (deleteTargetIds.length === 1) {
        await deleteUser(deleteTargetIds[0])
      } else {
        await deleteUsers(deleteTargetIds)
      }
      setIsDeleteModalOpen(false)
      setSelectedIds(new Set())
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id, !user.is_active)
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sort !== column) {
      return <span className="text-slate-300 ml-1">&#8597;</span>
    }
    return filters.sortDirection === 'asc'
      ? <span className="text-teal-600 ml-1">&#8593;</span>
      : <span className="text-teal-600 ml-1">&#8595;</span>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users Management</h1>
          <p className="text-slate-500 mt-1">Manage system users and their access</p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/30 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Users"
          value={stats.active}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Inactive Users"
          value={stats.inactive}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
        <StatCard
          title="Administrators"
          value={stats.admins}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Role Filter */}
          <div className="w-full lg:w-48">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              <option value="All">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Items per page */}
          <div className="w-full lg:w-32">
            <select
              value={filters.items}
              onChange={(e) => setFilters({ ...filters, items: Number(e.target.value), page: 1 })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => handleDelete(Array.from(selectedIds))}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.size === users.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                </th>
                <th
                  className="px-4 py-4 text-left text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  User <SortIcon column="name" />
                </th>
                <th
                  className="px-4 py-4 text-left text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort('email')}
                >
                  Email <SortIcon column="email" />
                </th>
                <th
                  className="px-4 py-4 text-left text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort('role')}
                >
                  Role <SortIcon column="role" />
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">
                  Branches
                </th>
                <th
                  className="px-4 py-4 text-left text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort('is_active')}
                >
                  Status <SortIcon column="is_active" />
                </th>
                <th
                  className="px-4 py-4 text-left text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
                  onClick={() => handleSort('last_sign_in_at')}
                >
                  Last Login <SortIcon column="last_sign_in_at" />
                </th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 mt-3">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 font-medium">No users found</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} email={user.email} />
                        <span className="font-medium text-slate-800">
                          {user.name || 'Unnamed User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{user.email}</td>
                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-4">
                      {user.branches && user.branches.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.branches.slice(0, 2).map(branch => (
                            <span
                              key={branch.id}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                            >
                              {branch.branch_name}
                            </span>
                          ))}
                          {user.branches.length > 2 && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                              +{user.branches.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">None</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.is_active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-sm">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete([user.id])}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Showing {((filters.page - 1) * filters.items) + 1} to {Math.min(filters.page * filters.items, totalCount)} of {totalCount} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: 1 })}
                disabled={filters.page === 1}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg">
                {filters.page} / {totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === totalPages}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: totalPages })}
                disabled={filters.page === totalPages}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        user={editingUser}
        roles={roles}
        branches={branches}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        count={deleteTargetIds.length}
      />
    </div>
  )
}
