'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  getRequisitions,
  createRequisition,
  updateRequisition,
  deleteRequisition,
  deleteRequisitions,
  getBranches,
  getAccountCategories,
  getAccounts,
  getVendors,
  getRequisitionStatuses,
  getRequisitionStats
} from '@/lib/services/requisitions'
import type { Requisition, RequisitionFilters, AccountCategory, Account } from '@/types/requisition'
import type { Branch } from '@/types/register'

// Icons
function DocumentIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

function CurrencyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Format currency
function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount)
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon, gradient }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Requisition Modal Component
function RequisitionModal({
  isOpen,
  onClose,
  onSave,
  requisition,
  mode,
  branches,
  categories,
  statuses
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (requisition: Partial<Requisition>) => Promise<void>
  requisition: Requisition | null
  mode: 'create' | 'edit'
  branches: Branch[]
  categories: AccountCategory[]
  statuses: string[]
}) {
  const [formData, setFormData] = useState<Partial<Requisition>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'Draft',
    amount: 0
  })
  const [accounts, setAccounts] = useState<Account[]>([])
  const [vendors, setVendors] = useState<{ id: number, name: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (requisition && mode === 'edit') {
      setFormData({ ...requisition })
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        branch_id: branches[0]?.id || null,
        category_id: null,
        account_id: null,
        contact_id: null,
        or_number: '',
        check: '',
        actual: '',
        reason: '',
        amount: 0,
        status: 'Draft',
        remarks: ''
      })
    }
    setErrors({})
  }, [requisition, mode, isOpen, branches])

  // Load accounts when category changes
  useEffect(() => {
    if (formData.category_id) {
      getAccounts(formData.category_id).then(setAccounts)
    } else {
      setAccounts([])
    }
  }, [formData.category_id])

  // Load vendors on mount
  useEffect(() => {
    getVendors().then(setVendors)
  }, [])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }
    if (!formData.branch_id) {
      newErrors.branch_id = 'Branch is required'
    }
    if (!formData.reason?.trim()) {
      newErrors.reason = 'Reason is required'
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (validate()) {
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

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 rounded-t-2xl z-10">
            <h3 className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Create Requisition' : 'Edit Requisition'}
            </h3>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.date ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branch_id || ''}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? parseInt(e.target.value) : null })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.branch_id ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white`}
                >
                  <option value="">Select...</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                {errors.branch_id && <p className="mt-1 text-sm text-red-500">{errors.branch_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null, account_id: null })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">Select...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.category}:{cat.type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account
                </label>
                <select
                  value={formData.account_id || ''}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  disabled={!formData.category_id}
                >
                  <option value="">Select...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor/Contact
                </label>
                <select
                  value={formData.contact_id || ''}
                  onChange={(e) => setFormData({ ...formData, contact_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">Select...</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'Draft'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount & References */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${errors.amount ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="0.00"
                />
                {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  OR Number
                </label>
                <input
                  type="text"
                  value={formData.or_number || ''}
                  onChange={(e) => setFormData({ ...formData, or_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Check Number
                </label>
                <input
                  type="text"
                  value={formData.check || ''}
                  onChange={(e) => setFormData({ ...formData, check: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Reason & Remarks */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.reason ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                rows={2}
                placeholder="Purpose of this requisition"
              />
              {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={2}
                placeholder="Additional notes"
              />
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
                  mode === 'create' ? 'Create Requisition' : 'Save Changes'
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
            Delete {count > 1 ? `${count} Requisitions` : 'Requisition'}?
          </h3>
          <p className="text-sm text-slate-500 text-center mb-6">
            This action cannot be undone. The selected requisition{count > 1 ? 's' : ''} will be permanently removed.
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

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [branches, setBranches] = useState<Branch[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [stats, setStats] = useState<any>({ total: 0, totalAmount: 0, byStatus: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<RequisitionFilters>({
    date_from: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    branch_id: 'All',
    status: 'All',
    category_id: 'All',
    search: '',
    page: 1,
    items: 10,
    sort: 'date',
    sortDirection: 'desc'
  })

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingRequisition, setEditingRequisition] = useState<Requisition | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [requisitionsResult, branchesData, categoriesData, statusesData, statsData] = await Promise.all([
        getRequisitions(filters),
        getBranches(),
        getAccountCategories(),
        getRequisitionStatuses(),
        getRequisitionStats()
      ])
      setRequisitions(requisitionsResult.data)
      setTotalCount(requisitionsResult.count)
      setBranches(branchesData)
      setCategories(categoriesData)
      setStatuses(statusesData)
      setStats(statsData)
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
      sortDirection: prev.sort === column && prev.sortDirection === 'desc' ? 'asc' : 'desc'
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(requisitions.map(r => r.id)))
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
    setEditingRequisition(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (requisition: Requisition) => {
    setEditingRequisition(requisition)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSave = async (requisitionData: Partial<Requisition>) => {
    // TODO: Get actual user ID from session
    const userId = 1
    if (modalMode === 'create') {
      await createRequisition(requisitionData, userId)
    } else if (editingRequisition) {
      await updateRequisition(editingRequisition.id, requisitionData, userId)
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
      await deleteRequisition([...selectedIds][0])
    } else {
      await deleteRequisitions([...selectedIds])
    }
    setSelectedIds(new Set())
    setIsDeleteModalOpen(false)
    loadData()
  }

  // Pagination
  const totalPages = Math.ceil(totalCount / filters.items)

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      'Draft': 'bg-slate-100 text-slate-800',
      'Submitted': 'bg-purple-100 text-purple-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Paid': 'bg-emerald-100 text-emerald-800',
      'Cancelled': 'bg-red-100 text-red-800'
    }
    const color = colors[status || 'Draft'] || colors['Draft']
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{status || 'Draft'}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Requisitions</h1>
          <p className="text-sm text-slate-500 mt-1">Manage purchase requisitions and approvals</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          New Requisition
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requisitions"
          value={stats.total}
          icon={<DocumentIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          icon={<CurrencyIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <StatCard
          title="Pending Approval"
          value={stats.byStatus['Submitted']?.count || 0}
          subtitle={formatCurrency(stats.byStatus['Submitted']?.amount || 0)}
          icon={<DocumentIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-purple-400 to-purple-600"
        />
        <StatCard
          title="Paid"
          value={stats.byStatus['Paid']?.count || 0}
          subtitle={formatCurrency(stats.byStatus['Paid']?.amount || 0)}
          icon={<CurrencyIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Date Range */}
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value, page: 1 }))}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value, page: 1 }))}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              <option value="All">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Branch Filter */}
            <select
              value={filters.branch_id}
              onChange={(e) => setFilters(prev => ({ ...prev, branch_id: e.target.value === 'All' ? 'All' : parseInt(e.target.value), page: 1 }))}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              <option value="All">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
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
                    checked={requisitions.length > 0 && selectedIds.size === requisitions.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {filters.sort === 'date' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Category/Account
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Branch
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {filters.sort === 'amount' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : requisitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <DocumentIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-900 font-medium">No requisitions found</p>
                      <p className="text-sm text-slate-500 mt-1">Create a new requisition to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requisitions.map((requisition) => (
                  <tr key={requisition.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(requisition.id)}
                        onChange={(e) => handleSelectOne(requisition.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-900">
                        {requisition.date ? format(new Date(requisition.date), 'MMM dd, yyyy') : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{requisition.reason || '-'}</p>
                        {requisition.contact_name && (
                          <p className="text-xs text-slate-500">{requisition.contact_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-slate-700">{requisition.category_name || '-'}</p>
                        {requisition.account_name && (
                          <p className="text-xs text-slate-500">{requisition.account_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-700">{requisition.branch_name || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(requisition.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(requisition.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(requisition)}
                          className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(requisition.id)}
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
              Showing {((filters.page - 1) * filters.items) + 1} to {Math.min(filters.page * filters.items, totalCount)} of {totalCount}
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
      <RequisitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        requisition={editingRequisition}
        mode={modalMode}
        branches={branches}
        categories={categories}
        statuses={statuses}
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
