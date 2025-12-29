'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getLookups,
  getTypes,
  createLookup,
  updateLookup,
  deleteLookup,
  deleteLookups
} from '@/lib/services/lookup'
import type { Lookup, LookupFilters } from '@/types/lookup'

// Icons
function LookupIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function TagIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PlusIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function EditIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function ChevronIcon({ direction, className = "w-4 h-4" }: { direction: 'up' | 'down' | 'left' | 'right', className?: string }) {
  const rotations = { up: 'rotate-180', down: '', left: 'rotate-90', right: '-rotate-90' }
  return (
    <svg className={`${className} ${rotations[direction]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, gradient }: {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Lookup Modal Component
function LookupModal({
  isOpen,
  onClose,
  onSave,
  lookup,
  mode,
  types
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (lookup: Partial<Lookup>) => Promise<void>
  lookup: Lookup | null
  mode: 'create' | 'edit'
  types: string[]
}) {
  const [formData, setFormData] = useState<Partial<Lookup>>({
    type: '',
    description: '',
    code: '',
    status: 'active',
    list_order: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newType, setNewType] = useState('')
  const [showNewType, setShowNewType] = useState(false)

  useEffect(() => {
    if (lookup && mode === 'edit') {
      setFormData({ ...lookup })
      setShowNewType(false)
    } else {
      setFormData({
        type: '',
        description: '',
        code: '',
        status: 'active',
        list_order: 0
      })
      setShowNewType(false)
      setNewType('')
    }
    setErrors({})
  }, [lookup, mode, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    const type = showNewType ? newType : formData.type
    if (!type?.trim()) {
      newErrors.type = 'Type is required'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (validate()) {
        const dataToSave = {
          ...formData,
          type: showNewType ? newType : formData.type
        }
        await onSave(dataToSave)
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 rounded-t-2xl">
            <h3 className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Add Lookup Value' : 'Edit Lookup Value'}
            </h3>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              {!showNewType ? (
                <div className="space-y-2">
                  <select
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.type ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white`}
                  >
                    <option value="">Select type...</option>
                    {types.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewType(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    + Create new type
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.type ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    placeholder="Enter new type name"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewType(false)
                      setNewType('')
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Use existing type
                  </button>
                </div>
              )}
              {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.description ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Enter description"
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., A, B, C"
              />
            </div>

            {/* List Order */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                List Order
              </label>
              <input
                type="number"
                value={formData.list_order || 0}
                onChange={(e) => setFormData({ ...formData, list_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                min="0"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
              <span className="text-sm font-medium text-slate-700">Active</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  mode === 'create' ? 'Create' : 'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm transform transition-all p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
            <TrashIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
            Delete {count > 1 ? `${count} Items` : 'Item'}?
          </h3>
          <p className="text-sm text-slate-500 text-center mb-6">
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LookupPage() {
  const [lookups, setLookups] = useState<Lookup[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [types, setTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<LookupFilters>({
    search: '',
    type: 'All',
    status: 'All',
    page: 1,
    items: 15,
    sort: 'type',
    sortDirection: 'asc'
  })

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingLookup, setEditingLookup] = useState<Lookup | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Stats
  const stats = useMemo(() => {
    const active = lookups.filter(l => l.status === 'active').length
    const inactive = lookups.filter(l => l.status !== 'active').length
    return { totalCount, active, inactive, typeCount: types.length }
  }, [lookups, totalCount, types])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [lookupsResult, typesData] = await Promise.all([
        getLookups(filters),
        getTypes()
      ])
      setLookups(lookupsResult.data)
      setTotalCount(lookupsResult.count)
      setTypes(typesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters])

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))
  }

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sort: column,
      sortDirection: prev.sort === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(lookups.map(l => l.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const handleCreate = () => {
    setEditingLookup(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (lookup: Lookup) => {
    setEditingLookup(lookup)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSave = async (lookupData: Partial<Lookup>) => {
    if (modalMode === 'create') {
      await createLookup(lookupData)
    } else if (editingLookup) {
      await updateLookup(editingLookup.id, lookupData)
    }
    loadData()
  }

  const handleDelete = async (id: number) => {
    setSelectedIds(new Set([id]))
    setIsDeleteModalOpen(true)
  }

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      setIsDeleteModalOpen(true)
    }
  }

  const confirmDelete = async () => {
    if (selectedIds.size === 1) {
      await deleteLookup([...selectedIds][0])
    } else {
      await deleteLookups([...selectedIds])
    }
    setSelectedIds(new Set())
    setIsDeleteModalOpen(false)
    loadData()
  }

  // Pagination
  const totalPages = Math.ceil(totalCount / filters.items)

  const getStatusBadge = (isActive: boolean | null) => {
    if (isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Inactive</span>
  }

  const getTypeColor = (type: string | null) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-amber-100 text-amber-800',
      'bg-teal-100 text-teal-800',
      'bg-rose-100 text-rose-800',
      'bg-indigo-100 text-indigo-800',
      'bg-emerald-100 text-emerald-800',
      'bg-orange-100 text-orange-800'
    ]
    const index = type ? Math.abs(type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length : 0
    return colors[index]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lookup Values</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system lookup values and configuration</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Add Lookup
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Values"
          value={stats.totalCount}
          icon={<LookupIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Types"
          value={stats.typeCount}
          icon={<TagIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-purple-400 to-purple-600"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<LookupIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={<LookupIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-slate-400 to-slate-600"
        />
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search lookups..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              <option value="All">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              <option value="All">All Status</option>
              <option value="A">Active</option>
              <option value="I">Inactive</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={lookups.length > 0 && selectedIds.size === lookups.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {filters.sort === 'type' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Description
                    {filters.sort === 'description' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-1">
                    Code
                    {filters.sort === 'code' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('list_order')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Order
                    {filters.sort === 'list_order' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : lookups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <LookupIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-900 font-medium">No lookup values found</p>
                      <p className="text-sm text-slate-500 mt-1">Get started by adding a lookup value</p>
                    </div>
                  </td>
                </tr>
              ) : (
                lookups.map((lookup) => (
                  <tr key={lookup.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lookup.id)}
                        onChange={(e) => handleSelectOne(lookup.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(lookup.type)}`}>
                        {lookup.type || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-900">{lookup.description || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600 font-mono">{lookup.code || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(lookup.status === 'active')}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-slate-600">{lookup.list_order ?? 0}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(lookup)}
                          className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(lookup.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon />
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-500">
              Showing {((filters.page - 1) * filters.items) + 1} to {Math.min(filters.page * filters.items, totalCount)} of {totalCount} values
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                disabled={filters.page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={filters.page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronIcon direction="left" />
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-700">
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={filters.page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronIcon direction="right" />
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: totalPages }))}
                disabled={filters.page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <LookupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        lookup={editingLookup}
        mode={modalMode}
        types={types}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        count={selectedIds.size}
      />
    </div>
  )
}
