'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  deleteServices,
  checkServiceCodeExists
} from '@/lib/services/services'
import type { Service, ServiceFilters } from '@/types/service'

// Icons
function ServiceIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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

function DollarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

// Service Modal Component
function ServiceModal({
  isOpen,
  onClose,
  onSave,
  service,
  mode
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (service: Partial<Service>) => Promise<void>
  service: Service | null
  mode: 'create' | 'edit'
}) {
  const [formData, setFormData] = useState<Partial<Service>>({
    service_code: '',
    description: '',
    price: 0,
    status: 'A'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (service && mode === 'edit') {
      setFormData({
        service_code: service.service_code || '',
        description: service.description || '',
        price: service.price || 0,
        status: service.status || 'A'
      })
    } else {
      setFormData({
        service_code: '',
        description: '',
        price: 0,
        status: 'A'
      })
    }
    setErrors({})
  }, [service, mode, isOpen])

  const validate = async () => {
    const newErrors: Record<string, string> = {}

    if (!formData.service_code?.trim()) {
      newErrors.service_code = 'Service code is required'
    } else {
      // Check for duplicate service code
      const exists = await checkServiceCodeExists(
        formData.service_code,
        mode === 'edit' ? service?.id : undefined
      )
      if (exists) {
        newErrors.service_code = 'Service code already exists'
      }
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.price === null || formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Valid price is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (await validate()) {
        await onSave(formData)
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
              {mode === 'create' ? 'Add New Service' : 'Edit Service'}
            </h3>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Service Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.service_code || ''}
                onChange={(e) => setFormData({ ...formData, service_code: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.service_code ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-teal-500'} focus:outline-none focus:ring-2 focus:border-transparent`}
                placeholder="e.g., TDC-001"
              />
              {errors.service_code && <p className="mt-1 text-sm text-red-500">{errors.service_code}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.description ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-teal-500'} focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
                placeholder="Service description..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${errors.price ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-teal-500'} focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status || 'A'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              >
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </select>
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
                  mode === 'create' ? 'Create Service' : 'Save Changes'
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
            Delete {count > 1 ? `${count} Services` : 'Service'}?
          </h3>
          <p className="text-sm text-slate-500 text-center mb-6">
            This action cannot be undone. The selected service{count > 1 ? 's' : ''} will be permanently removed.
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    status: 'All',
    page: 1,
    items: 10,
    sort: 'service_code',
    sortDirection: 'asc'
  })

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Stats
  const stats = useMemo(() => {
    const active = services.filter(s => s.status === 'A').length
    const inactive = services.filter(s => s.status === 'I').length
    const totalRevenue = services.reduce((sum, s) => sum + (s.price || 0), 0)
    const avgPrice = services.length > 0 ? totalRevenue / services.length : 0
    return { active, inactive, totalCount, avgPrice }
  }, [services, totalCount])

  const loadServices = async () => {
    setIsLoading(true)
    try {
      const result = await getServices(filters)
      setServices(result.data)
      setTotalCount(result.count)
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [filters])

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
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
      setSelectedIds(new Set(services.map(s => s.id)))
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
    setEditingService(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSave = async (serviceData: Partial<Service>) => {
    if (modalMode === 'create') {
      await createService(serviceData)
    } else if (editingService) {
      await updateService(editingService.id, serviceData)
    }
    loadServices()
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
      await deleteService([...selectedIds][0])
    } else {
      await deleteServices([...selectedIds])
    }
    setSelectedIds(new Set())
    setIsDeleteModalOpen(false)
    loadServices()
  }

  // Pagination
  const totalPages = Math.ceil(totalCount / filters.items)

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (status === 'A') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Inactive</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-sm text-slate-500 mt-1">Manage service offerings and pricing</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Services"
          value={stats.totalCount}
          icon={<ServiceIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Active Services"
          value={stats.active}
          icon={<ServiceIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <StatCard
          title="Inactive Services"
          value={stats.inactive}
          icon={<ServiceIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-slate-400 to-slate-600"
        />
        <StatCard
          title="Average Price"
          value={formatCurrency(stats.avgPrice)}
          icon={<DollarIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-amber-400 to-amber-600"
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
                placeholder="Search services..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
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
                    checked={services.length > 0 && selectedIds.size === services.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('service_code')}
                >
                  <div className="flex items-center gap-1">
                    Service Code
                    {filters.sort === 'service_code' && (
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
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Price
                    {filters.sort === 'price' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status
                    {filters.sort === 'status' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center gap-1">
                    Last Update
                    {filters.sort === 'updated_at' && (
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
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <ServiceIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-900 font-medium">No services found</p>
                      <p className="text-sm text-slate-500 mt-1">Get started by adding a new service</p>
                    </div>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(service.id)}
                        onChange={(e) => handleSelectOne(service.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-900">{service.service_code}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-700">{service.description || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-medium text-slate-900">{formatCurrency(service.price)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(service.status)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-500">{formatDate(service.updated_at)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
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
              Showing {((filters.page - 1) * filters.items) + 1} to {Math.min(filters.page * filters.items, totalCount)} of {totalCount} services
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
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        service={editingService}
        mode={modalMode}
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
