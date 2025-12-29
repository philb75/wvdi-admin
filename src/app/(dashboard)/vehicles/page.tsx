'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  deleteVehicles,
  getBranches,
  getVehicleStatuses,
} from '@/lib/services/vehicles'
import type { Vehicle, VehicleFilters } from '@/types/vehicle'
import type { Branch } from '@/types/register'
import { useAuth } from '@/lib/contexts/AuthContext'

// Status config
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  A: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100' },
  I: { label: 'Inactive', color: 'text-gray-700', bg: 'bg-gray-100' },
  S: { label: 'Sold', color: 'text-blue-700', bg: 'bg-blue-100' },
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-75">{label}</div>
        </div>
      </div>
    </div>
  )
}

// Vehicle Icon Component
function VehicleIcon({ brand, color }: { brand: string | null; color: string | null }) {
  const colors = [
    'from-teal-400 to-emerald-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-cyan-400 to-blue-500',
    'from-emerald-400 to-teal-500',
  ]
  const colorIndex = (brand?.charCodeAt(0) || 0) % colors.length

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br ${colors[colorIndex]} shadow-sm`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </div>
  )
}

// Vehicle Modal Component
function VehicleModal({
  isOpen,
  onClose,
  vehicle,
  onSave,
  branches,
  statuses,
}: {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
  onSave: (data: Partial<Vehicle>) => Promise<void>
  branches: Branch[]
  statuses: string[]
}) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    branch_id: null,
    brand: '',
    model: '',
    color: '',
    plate_number: '',
    start_date: '',
    price_purchased: null,
    end_date: '',
    price_sold: null,
    status: 'A',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        setFormData({
          branch_id: vehicle.branch_id,
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          color: vehicle.color || '',
          plate_number: vehicle.plate_number || '',
          start_date: vehicle.start_date || '',
          price_purchased: vehicle.price_purchased,
          end_date: vehicle.end_date || '',
          price_sold: vehicle.price_sold,
          status: vehicle.status || 'A',
        })
      } else {
        setFormData({
          branch_id: null,
          brand: '',
          model: '',
          color: '',
          plate_number: '',
          start_date: '',
          price_purchased: null,
          end_date: '',
          price_sold: null,
          status: 'A',
        })
      }
      setErrors({})
    }
  }, [isOpen, vehicle])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.branch_id) newErrors.branch_id = 'Branch is required'
    if (!formData.brand?.trim()) newErrors.brand = 'Brand is required'
    if (!formData.plate_number?.trim()) newErrors.plate_number = 'Plate number is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving vehicle:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-500 to-teal-600">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {vehicle ? 'Edit Vehicle' : 'New Vehicle'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Vehicle Info Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Vehicle Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branch_id || ''}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? Number(e.target.value) : null })}
                  className={`w-full rounded-lg border ${errors.branch_id ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className={`w-full rounded-lg border ${errors.brand ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="Toyota"
                />
                {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Vios"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="White"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.plate_number || ''}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  className={`w-full rounded-lg border ${errors.plate_number ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="ABC 1234"
                />
                {errors.plate_number && <p className="text-red-500 text-xs mt-1">{errors.plate_number}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status || 'A'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Financial Info Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Financial Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={formData.price_purchased || ''}
                  onChange={(e) => setFormData({ ...formData, price_purchased: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sold Price</label>
                <input
                  type="number"
                  value={formData.price_sold || ''}
                  onChange={(e) => setFormData({ ...formData, price_sold: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Vehicle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const { profile } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  // Filters
  const [filters, setFilters] = useState<VehicleFilters>({
    search: '',
    branch_id: 'All',
    status: 'All',
    page: 1,
    items: 10,
    sort: 'created_at',
    sortDirection: 'desc',
  })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    sold: 0,
  })

  const branchIds = useMemo(() => profile?.branches || [], [profile?.branches])

  const loadVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVehicles(filters, branchIds.length > 0 ? branchIds : undefined)
      setVehicles(result.data)
      setTotalCount(result.count)

      // Calculate stats
      const active = result.data.filter(v => v.status === 'A').length
      const inactive = result.data.filter(v => v.status === 'I').length
      const sold = result.data.filter(v => v.status === 'S').length
      setStats({
        total: result.count,
        active,
        inactive,
        sold,
      })
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, branchIds])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  useEffect(() => {
    Promise.all([
      getBranches(),
      getVehicleStatuses(),
    ]).then(([b, s]) => {
      setBranches(b)
      setStatuses(s)
    })
  }, [])

  const handleSaveVehicle = async (data: Partial<Vehicle>) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.id, data)
    } else {
      await createVehicle(data)
    }
    await loadVehicles()
    setEditingVehicle(null)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} vehicle(s)?`)) return

    await deleteVehicles(selectedIds)
    setSelectedIds([])
    await loadVehicles()
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? vehicles.map(v => v.id) : [])
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))
  }

  const totalPages = Math.ceil(totalCount / filters.items)

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
          <p className="text-gray-500 text-sm mt-1">Manage company vehicles</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null)
            setShowModal(true)
          }}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-teal-600 hover:to-teal-700 transition-all shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Vehicles"
          value={stats.total}
          color="teal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />
        <StatCard
          label="Active"
          value={stats.active}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          color="gray"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Sold"
          value={stats.sold}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search vehicles..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <select
              value={filters.branch_id}
              onChange={(e) => setFilters({ ...filters, branch_id: e.target.value === 'All' ? 'All' : Number(e.target.value), page: 1 })}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Status</option>
              {statuses.map(s => (
                <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
              ))}
            </select>
            <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Delete Selected */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-500">Loading vehicles...</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-lg font-medium">No vehicles found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === vehicles.length && vehicles.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Plate Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Purchase Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicles.map(vehicle => {
                  const status = statusConfig[vehicle.status || 'A'] || statusConfig.A
                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(vehicle.id)}
                          onChange={(e) => handleSelectOne(vehicle.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <VehicleIcon brand={vehicle.brand} color={vehicle.color} />
                          <div>
                            <div className="font-medium text-gray-800">{vehicle.full_name || 'Unknown Vehicle'}</div>
                            <div className="text-sm text-gray-500">{vehicle.model || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-800">{vehicle.plate_number}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{vehicle.branch_name}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(vehicle.price_purchased)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingVehicle(vehicle)
                              setShowModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this vehicle?')) {
                                await deleteVehicle(vehicle.id)
                                await loadVehicles()
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((filters.page - 1) * filters.items) + 1} to {Math.min(filters.page * filters.items, totalCount)} of {totalCount} vehicles
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: 1 })}
                  disabled={filters.page === 1}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-gray-600">
                  Page {filters.page} of {totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: totalPages })}
                  disabled={filters.page >= totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <VehicleModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingVehicle(null)
        }}
        vehicle={editingVehicle}
        onSave={handleSaveVehicle}
        branches={branches}
        statuses={statuses}
      />
    </div>
  )
}
