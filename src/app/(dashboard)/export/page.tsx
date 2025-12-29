'use client'

import { useState, useEffect } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import * as XLSX from 'xlsx'
import {
  getRegisterData,
  getStudentsData,
  getRequisitionsData,
  getBranches,
  type ExportFilters
} from '@/lib/services/exports'
import type { Branch } from '@/types/register'

type ExportType = 'all' | 'register' | 'students' | 'requisitions'

export default function ExportPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<ExportType>('all')
  const [filters, setFilters] = useState<ExportFilters>({
    date_from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    branch_id: 'All'
  })
  const [exportStats, setExportStats] = useState({
    register: 0,
    students: 0,
    requisitions: 0
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const data = await getBranches()
      setBranches(data)
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const workbook = XLSX.utils.book_new()
      const dateStr = format(new Date(), 'MM-dd-yyyy')
      let stats = { register: 0, students: 0, requisitions: 0 }

      // Export Register
      if (exportType === 'all' || exportType === 'register') {
        const registerData = await getRegisterData(filters)
        stats.register = registerData.length

        const registerHeaders = [
          'ID', 'Date', 'Branch', 'Type', 'Contact', 'Service', 'Account',
          'Amount', 'Cash', 'Bank', 'GCash', 'Check', 'Status', 'Created By', 'Created At'
        ]
        const registerRows = registerData.map(r => [
          r.id, r.date, r.branch, r.type, r.contact, r.service, r.account,
          r.amount, r.cash, r.bank, r.gcash, r.check, r.status, r.created_by, r.created_at
        ])

        const registerSheet = XLSX.utils.aoa_to_sheet([registerHeaders, ...registerRows])

        // Set column widths
        registerSheet['!cols'] = [
          { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
          { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
        ]

        XLSX.utils.book_append_sheet(workbook, registerSheet, 'Register')
      }

      // Export Students
      if (exportType === 'all' || exportType === 'students') {
        const studentsData = await getStudentsData(filters)
        stats.students = studentsData.length

        const studentHeaders = [
          'ID', 'Branch', 'First Name', 'Middle Name', 'Last Name', 'Nick Name',
          'Gender', 'Birthday', 'Phone 1', 'Phone 2', 'Email', 'Address', 'City',
          'Region', 'Zip Code', 'Status', 'Created At'
        ]
        const studentRows = studentsData.map(s => [
          s.id, s.branch, s.first_name, s.middle_name, s.last_name, s.nick_name,
          s.gender, s.birthday, s.phone1, s.phone2, s.email, s.address, s.city,
          s.region, s.zip_code, s.status, s.created_at
        ])

        const studentsSheet = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentRows])

        // Set column widths
        studentsSheet['!cols'] = [
          { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
          { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
          { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 20 }
        ]

        XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students')
      }

      // Export Requisitions
      if (exportType === 'all' || exportType === 'requisitions') {
        const requisitionsData = await getRequisitionsData(filters)
        stats.requisitions = requisitionsData.length

        const requisitionHeaders = [
          'ID', 'Date', 'Branch', 'OR Number', 'Check', 'Actual', 'Category',
          'Account', 'Vendor', 'Reason', 'Amount', 'Status', 'Remarks',
          'Requestor', 'Approver', 'Approved At', 'Created At'
        ]
        const requisitionRows = requisitionsData.map(r => [
          r.id, r.date, r.branch, r.or_number, r.check, r.actual, r.category,
          r.account, r.vendor, r.reason, r.amount, r.status, r.remarks,
          r.requestor, r.approver, r.approved_at, r.created_at
        ])

        const requisitionsSheet = XLSX.utils.aoa_to_sheet([requisitionHeaders, ...requisitionRows])

        // Set column widths
        requisitionsSheet['!cols'] = [
          { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
          { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 30 },
          { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
        ]

        XLSX.utils.book_append_sheet(workbook, requisitionsSheet, 'Requisitions')
      }

      setExportStats(stats)

      // Generate and download file
      const fileName = `WVDI-Export-(${dateStr}).xlsx`
      XLSX.writeFile(workbook, fileName)

      setMessage({
        type: 'success',
        text: `Export completed successfully! Downloaded: ${fileName}`
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      setMessage({
        type: 'error',
        text: 'Error exporting data. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    setLoading(true)
    setMessage(null)

    try {
      let stats = { register: 0, students: 0, requisitions: 0 }

      if (exportType === 'all' || exportType === 'register') {
        const registerData = await getRegisterData(filters)
        stats.register = registerData.length
      }

      if (exportType === 'all' || exportType === 'students') {
        const studentsData = await getStudentsData(filters)
        stats.students = studentsData.length
      }

      if (exportType === 'all' || exportType === 'requisitions') {
        const requisitionsData = await getRequisitionsData(filters)
        stats.requisitions = requisitionsData.length
      }

      setExportStats(stats)
      setMessage({
        type: 'success',
        text: 'Preview loaded. Click Export to download the file.'
      })
    } catch (error) {
      console.error('Error previewing data:', error)
      setMessage({
        type: 'error',
        text: 'Error loading preview. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Export Data</h1>
          <p className="text-slate-500 mt-1">Export data to Excel format</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Export Form */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Export Options</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Export Type
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Data</option>
              <option value="register">Register Only</option>
              <option value="students">Students Only</option>
              <option value="requisitions">Requisitions Only</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Branch
            </label>
            <select
              value={filters.branch_id}
              onChange={(e) => setFilters({
                ...filters,
                branch_id: e.target.value === 'All' ? 'All' : Number(e.target.value)
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="All">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-slate-500 self-center">Quick filters:</span>
          <button
            onClick={() => setFilters({
              ...filters,
              date_from: format(new Date(), 'yyyy-MM-dd'),
              date_to: format(new Date(), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
          >
            Today
          </button>
          <button
            onClick={() => setFilters({
              ...filters,
              date_from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
              date_to: format(new Date(), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setFilters({
              ...filters,
              date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
              date_to: format(new Date(), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setFilters({
              ...filters,
              date_from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
              date_to: format(new Date(), 'yyyy-MM-dd')
            })}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const thisYear = new Date().getFullYear()
              setFilters({
                ...filters,
                date_from: `${thisYear}-01-01`,
                date_to: format(new Date(), 'yyyy-MM-dd')
              })
            }}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
          >
            This Year
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Preview Count'}
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {loading ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {/* Preview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Register Stats */}
        <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${
          exportType !== 'all' && exportType !== 'register' ? 'opacity-50' : ''
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Register Records</p>
              <p className="text-2xl font-bold text-slate-800">
                {exportStats.register.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Students Stats */}
        <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${
          exportType !== 'all' && exportType !== 'students' ? 'opacity-50' : ''
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Student Records</p>
              <p className="text-2xl font-bold text-slate-800">
                {exportStats.students.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Requisitions Stats */}
        <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${
          exportType !== 'all' && exportType !== 'requisitions' ? 'opacity-50' : ''
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Requisition Records</p>
              <p className="text-2xl font-bold text-slate-800">
                {exportStats.requisitions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Export Information</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>The exported Excel file will contain the following sheets based on your selection:</li>
          <li className="ml-4">- <strong>Register:</strong> Financial transactions filtered by date range</li>
          <li className="ml-4">- <strong>Students:</strong> All students (date filter applies to branch only)</li>
          <li className="ml-4">- <strong>Requisitions:</strong> Expense requisitions filtered by date range</li>
          <li className="mt-2">Note: Large exports may take a few moments to process.</li>
        </ul>
      </div>
    </div>
  )
}
