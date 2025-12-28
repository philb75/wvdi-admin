'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  deleteContacts,
  getBranches,
  getContactTypes
} from '@/lib/services/contacts'
import type { Contact, ContactFilters } from '@/types/contact'
import type { Branch } from '@/types/register'

// Icons
function ContactIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

function PhoneIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function MailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function BuildingIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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

// Contact Avatar Component
function ContactAvatar({ contact, size = 'md' }: { contact: Contact, size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const getInitials = () => {
    const first = contact.first_name?.[0] || ''
    const last = contact.last_name?.[0] || ''
    return (first + last).toUpperCase() || '?'
  }

  const getGradient = () => {
    switch (contact.contact_type) {
      case 'Vendor': return 'from-purple-400 to-purple-600'
      case 'Customer': return 'from-blue-400 to-blue-600'
      case 'Employee': return 'from-teal-400 to-teal-600'
      case 'Instructor': return 'from-amber-400 to-amber-600'
      default: return 'from-slate-400 to-slate-600'
    }
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white font-semibold`}>
      {getInitials()}
    </div>
  )
}

// Contact Modal Component
function ContactModal({
  isOpen,
  onClose,
  onSave,
  contact,
  mode,
  branches,
  contactTypes
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (contact: Partial<Contact>) => Promise<void>
  contact: Contact | null
  mode: 'create' | 'edit'
  branches: Branch[]
  contactTypes: string[]
}) {
  const [formData, setFormData] = useState<Partial<Contact>>({
    first_name: '',
    last_name: '',
    contact_type: 'Customer',
    contact_status: 'A',
    branch_id: null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (contact && mode === 'edit') {
      setFormData({ ...contact })
    } else {
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        nick_name: '',
        company: '',
        contact_type: 'Customer',
        contact_status: 'A',
        email: '',
        phone1: '',
        phone2: '',
        address1: '',
        address2: '',
        city: '',
        region: '',
        zip_code: '',
        gender: '',
        branch_id: branches[0]?.id || null
      })
    }
    setErrors({})
  }, [contact, mode, isOpen, branches])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name?.trim() && !formData.company?.trim()) {
      newErrors.first_name = 'First name or company is required'
    }

    if (!formData.contact_type) {
      newErrors.contact_type = 'Contact type is required'
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
              {mode === 'create' ? 'Add New Contact' : 'Edit Contact'}
            </h3>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <ContactIcon className="w-4 h-4" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.first_name ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    placeholder="John"
                  />
                  {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middle_name || ''}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nick Name
                  </label>
                  <input
                    type="text"
                    value={formData.nick_name || ''}
                    onChange={(e) => setFormData({ ...formData, nick_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <PhoneIcon className="w-4 h-4" />
                Contact Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone 1
                  </label>
                  <input
                    type="tel"
                    value={formData.phone1 || ''}
                    onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="+63 9XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone 2
                  </label>
                  <input
                    type="tel"
                    value={formData.phone2 || ''}
                    onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <BuildingIcon className="w-4 h-4" />
                Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={formData.address1 || ''}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.address2 || ''}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code || ''}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Classification</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.contact_type || ''}
                    onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.contact_type ? 'border-red-300' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white`}
                  >
                    <option value="">Select...</option>
                    {contactTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.contact_type && <p className="mt-1 text-sm text-red-500">{errors.contact_type}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Branch
                  </label>
                  <select
                    value={formData.branch_id || ''}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Select...</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.contact_status || 'A'}
                    onChange={(e) => setFormData({ ...formData, contact_status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="A">Active</option>
                    <option value="I">Inactive</option>
                  </select>
                </div>
              </div>
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
                  mode === 'create' ? 'Create Contact' : 'Save Changes'
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
            Delete {count > 1 ? `${count} Contacts` : 'Contact'}?
          </h3>
          <p className="text-sm text-slate-500 text-center mb-6">
            This action cannot be undone. The selected contact{count > 1 ? 's' : ''} will be permanently removed.
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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [branches, setBranches] = useState<Branch[]>([])
  const [contactTypes, setContactTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ContactFilters>({
    search: '',
    branch_id: 'All',
    contact_type: 'All',
    status: 'All',
    page: 1,
    items: 10,
    sort: 'last_name',
    sortDirection: 'asc'
  })

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    contacts.forEach(c => {
      const type = c.contact_type || 'Other'
      byType[type] = (byType[type] || 0) + 1
    })
    return { totalCount, byType }
  }, [contacts, totalCount])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [contactsResult, branchesData, typesData] = await Promise.all([
        getContacts(filters),
        getBranches(),
        getContactTypes()
      ])
      setContacts(contactsResult.data)
      setTotalCount(contactsResult.count)
      setBranches(branchesData)
      setContactTypes(typesData)
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
      setSelectedIds(new Set(contacts.map(c => c.id)))
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
    setEditingContact(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSave = async (contactData: Partial<Contact>) => {
    if (modalMode === 'create') {
      await createContact(contactData)
    } else if (editingContact) {
      await updateContact(editingContact.id, contactData)
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
      await deleteContact([...selectedIds][0])
    } else {
      await deleteContacts([...selectedIds])
    }
    setSelectedIds(new Set())
    setIsDeleteModalOpen(false)
    loadData()
  }

  // Pagination
  const totalPages = Math.ceil(totalCount / filters.items)

  const getTypeBadge = (type: string | null) => {
    const colors: Record<string, string> = {
      'Vendor': 'bg-purple-100 text-purple-800',
      'Customer': 'bg-blue-100 text-blue-800',
      'Employee': 'bg-teal-100 text-teal-800',
      'Instructor': 'bg-amber-100 text-amber-800',
      'Other': 'bg-slate-100 text-slate-800'
    }
    const color = colors[type || 'Other'] || colors['Other']
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{type || 'Other'}</span>
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
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage vendors, customers, and other contacts</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={stats.totalCount}
          icon={<ContactIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Vendors"
          value={stats.byType['Vendor'] || 0}
          icon={<BuildingIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-purple-400 to-purple-600"
        />
        <StatCard
          title="Customers"
          value={stats.byType['Customer'] || 0}
          icon={<ContactIcon className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <StatCard
          title="Instructors"
          value={stats.byType['Instructor'] || 0}
          icon={<ContactIcon className="w-6 h-6" />}
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
                placeholder="Search contacts..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.contact_type}
              onChange={(e) => setFilters(prev => ({ ...prev, contact_type: e.target.value, page: 1 }))}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              <option value="All">All Types</option>
              {contactTypes.map(type => (
                <option key={type} value={type}>{type}</option>
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
                    checked={contacts.length > 0 && selectedIds.size === contacts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('last_name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {filters.sort === 'last_name' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('contact_type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {filters.sort === 'contact_type' && (
                      <ChevronIcon direction={filters.sortDirection === 'asc' ? 'up' : 'down'} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Branch
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
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <ContactIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-900 font-medium">No contacts found</p>
                      <p className="text-sm text-slate-500 mt-1">Get started by adding a new contact</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={(e) => handleSelectOne(contact.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ContactAvatar contact={contact} />
                        <div>
                          <p className="font-medium text-slate-900">{contact.full_name || contact.company || '-'}</p>
                          {contact.company && contact.full_name && (
                            <p className="text-sm text-slate-500">{contact.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getTypeBadge(contact.contact_type)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MailIcon className="w-4 h-4 text-slate-400" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone1 && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <PhoneIcon className="w-4 h-4 text-slate-400" />
                            {contact.phone1}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-700">{contact.branch_name || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(contact.contact_status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
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
              Showing {((filters.page - 1) * filters.items) + 1} to {Math.min(filters.page * filters.items, totalCount)} of {totalCount} contacts
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
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        contact={editingContact}
        mode={modalMode}
        branches={branches}
        contactTypes={contactTypes}
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
