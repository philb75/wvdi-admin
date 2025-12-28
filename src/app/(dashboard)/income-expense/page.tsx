'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getIncomeExpenseReport,
  getCategoryFilters,
  getBranchOptions,
  getAccountOptions,
  exportReportToCSV
} from '@/lib/services/income-expense'
import type {
  IncomeExpenseFilters,
  IncomeExpenseReport,
  CategoryData,
  Transaction,
  CategoryFilterData,
  BranchOption,
  AccountOption
} from '@/types/income-expense'

// Helper to format currency
function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  if (amount < 0) return `(${formatted})`
  return formatted
}

// Helper to get date 3 months ago
function getDefaultDateFrom(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 2)
  date.setDate(1)
  return date.toISOString().split('T')[0]
}

// Helper to get end of current month
function getDefaultDateTo(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  date.setDate(0)
  return date.toISOString().split('T')[0]
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
  isNegative = false
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'purple'
  isNegative?: boolean
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-slate-800'}`}>
            {formatCurrency(value)}
          </p>
        </div>
      </div>
    </div>
  )
}

// Category Row Component
function CategoryRow({
  category,
  level = 0,
  onDataClick
}: {
  category: CategoryData
  level?: number
  onDataClick: (title: string, transactions: Transaction[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasSubCategories = category.sub_category && category.sub_category.length > 0
  const isTotal = category.category.startsWith('Total') || category.category === 'Net Total'

  const bgClass = isTotal
    ? 'bg-slate-100 font-semibold'
    : level === 0
    ? 'bg-white hover:bg-slate-50'
    : 'bg-slate-50 hover:bg-slate-100'

  const textClass = isTotal
    ? 'text-slate-800'
    : level === 0
    ? 'text-slate-700 font-medium'
    : 'text-slate-600 text-sm'

  return (
    <>
      <tr className={`${bgClass} transition-colors border-b border-slate-100`}>
        <td className={`px-4 py-3 ${textClass}`} style={{ paddingLeft: `${16 + level * 24}px` }}>
          <div className="flex items-center gap-2">
            {hasSubCategories && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!hasSubCategories && <div className="w-5" />}
            <span>{category.category}</span>
          </div>
        </td>
        {category.data.map((amount, index) => (
          <td
            key={index}
            className={`px-3 py-3 text-right tabular-nums cursor-pointer hover:bg-teal-50 transition-colors ${
              amount < 0 ? 'text-red-600' : 'text-slate-700'
            }`}
            onClick={() => onDataClick(`${category.category} - Month ${index + 1}`, category.modal[index] || [])}
          >
            {amount !== 0 ? formatCurrency(amount) : '-'}
          </td>
        ))}
        <td className={`px-3 py-3 text-right tabular-nums ${category.average < 0 ? 'text-red-600' : 'text-slate-700'}`}>
          {formatCurrency(category.average)}
        </td>
        <td
          className={`px-3 py-3 text-right tabular-nums cursor-pointer hover:bg-teal-50 font-semibold transition-colors ${
            category.total < 0 ? 'text-red-600' : 'text-slate-700'
          }`}
          onClick={() => onDataClick(`${category.category} - All`, category.all_modal || [])}
        >
          {formatCurrency(category.total)}
        </td>
      </tr>
      {expanded && hasSubCategories && category.sub_category?.map((subCat, index) => (
        <CategoryRow
          key={index}
          category={subCat}
          level={level + 1}
          onDataClick={onDataClick}
        />
      ))}
    </>
  )
}

// Section Header Component
function SectionHeader({ title, color }: { title: string; color: string }) {
  const colorClasses: Record<string, string> = {
    income: 'bg-emerald-600',
    expense: 'bg-red-600',
    others: 'bg-amber-600',
    net: 'bg-purple-600'
  }

  return (
    <tr className={`${colorClasses[color] || 'bg-slate-600'} text-white`}>
      <td colSpan={100} className="px-4 py-2 font-semibold text-sm uppercase tracking-wide">
        {title}
      </td>
    </tr>
  )
}

// Transaction Modal
function TransactionModal({
  isOpen,
  onClose,
  title,
  transactions
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  transactions: Transaction[]
}) {
  if (!isOpen) return null

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {transactions.length} transactions | Total: {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Account</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Memo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Inflow</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Outflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((t, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.branch_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.account_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.contact_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{t.memo || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums text-emerald-600">
                      {t.inflow > 0 ? formatCurrency(t.inflow) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums text-red-600">
                      {t.outflow > 0 ? formatCurrency(t.outflow) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Filter Dropdown Component
function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  labelKey,
  valueKey
}: {
  label: string
  options: any[]
  selected: number[]
  onChange: (ids: number[]) => void
  labelKey: string
  valueKey: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectAll = () => {
    onChange(options.map(o => o[valueKey]))
  }

  const handleSelectNone = () => {
    onChange([])
  }

  const handleToggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors bg-white"
      >
        <span className="text-sm text-slate-700">{label}</span>
        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full font-medium">
          {selected.length}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 text-xs bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="px-3 py-1.5 text-xs bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {options.map(option => (
                <label
                  key={option[valueKey]}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option[valueKey])}
                    onChange={() => handleToggle(option[valueKey])}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">{option[labelKey]}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Main Page Component
export default function IncomeExpensePage() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<IncomeExpenseReport | null>(null)
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilterData | null>(null)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [accounts, setAccounts] = useState<AccountOption[]>([])

  const [filters, setFilters] = useState<IncomeExpenseFilters>({
    date_from: getDefaultDateFrom(),
    date_to: getDefaultDateTo(),
    branches: [],
    accounts: [],
    categories: [],
    uncategorized: false
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalTransactions, setModalTransactions] = useState<Transaction[]>([])

  // Load initial options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoryData, branchData, accountData] = await Promise.all([
          getCategoryFilters(),
          getBranchOptions(),
          getAccountOptions()
        ])

        setCategoryFilters(categoryData)
        setBranches(branchData)
        setAccounts(accountData)

        // Set default selections
        const allCategoryIds = [
          ...categoryData.income.flatMap(g => g.selected_sub_categories),
          ...categoryData.expense.flatMap(g => g.selected_sub_categories)
        ]

        setFilters(prev => ({
          ...prev,
          branches: branchData.map(b => b.id),
          accounts: accountData.map(a => a.id),
          categories: allCategoryIds
        }))
      } catch (error) {
        console.error('Failed to load options:', error)
      }
    }

    loadOptions()
  }, [])

  // Fetch report when filters change
  const fetchReport = useCallback(async () => {
    if (filters.branches.length === 0 || filters.accounts.length === 0 || filters.categories.length === 0) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getIncomeExpenseReport(filters)
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (filters.branches.length > 0 && filters.accounts.length > 0) {
      fetchReport()
    }
  }, [filters, fetchReport])

  const handleDataClick = (title: string, transactions: Transaction[]) => {
    setModalTitle(title)
    setModalTransactions(transactions)
    setModalOpen(true)
  }

  const handleExport = () => {
    if (report) {
      exportReportToCSV(report, `income-expense-${filters.date_from}-to-${filters.date_to}.csv`)
    }
  }

  // Calculate summary stats
  const incomeTotal = report?.income.find(c => c.category === 'Total Income')?.total || 0
  const expenseTotal = report?.expense.find(c => c.category === 'Total Expense')?.total || 0
  const netTotal = report?.net_total?.total || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Income vs Expense</h1>
          <p className="text-slate-500 mt-1">Financial performance report by category</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!report}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 font-medium disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={incomeTotal}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />
        <StatCard
          title="Total Expense"
          value={Math.abs(expenseTotal)}
          color="red"
          isNegative={expenseTotal < 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
        />
        <StatCard
          title="Net Income"
          value={netTotal}
          color={netTotal >= 0 ? 'purple' : 'red'}
          isNegative={netTotal < 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">From:</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">To:</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Branch Filter */}
          <FilterDropdown
            label="Branches"
            options={branches}
            selected={filters.branches}
            onChange={(ids) => setFilters({ ...filters, branches: ids })}
            labelKey="name"
            valueKey="id"
          />

          {/* Account Filter */}
          <FilterDropdown
            label="Accounts"
            options={accounts}
            selected={filters.accounts}
            onChange={(ids) => setFilters({ ...filters, accounts: ids })}
            labelKey="account_name"
            valueKey="id"
          />

          {/* Uncategorized Toggle */}
          <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl bg-white cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={filters.uncategorized}
              onChange={(e) => setFilters({ ...filters, uncategorized: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">Show Uncategorized</span>
          </label>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 mt-4">Loading report...</p>
            </div>
          ) : !report ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No data available</p>
              <p className="text-slate-400 text-sm mt-1">Select filters to generate report</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-64">Category</th>
                  {report.headers.map((header, index) => (
                    <th key={index} className="px-3 py-3 text-right text-sm font-semibold whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-sm font-semibold">Average</th>
                  <th className="px-3 py-3 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Income Section */}
                <SectionHeader title="Income" color="income" />
                {report.income.map((category, index) => (
                  <CategoryRow
                    key={`income-${index}`}
                    category={category}
                    onDataClick={handleDataClick}
                  />
                ))}

                {/* Expense Section */}
                <SectionHeader title="Expense" color="expense" />
                {report.expense.map((category, index) => (
                  <CategoryRow
                    key={`expense-${index}`}
                    category={category}
                    onDataClick={handleDataClick}
                  />
                ))}

                {/* Others Section */}
                {report.others.length > 0 && (
                  <>
                    <SectionHeader title="Others" color="others" />
                    {report.others.map((category, index) => (
                      <CategoryRow
                        key={`others-${index}`}
                        category={category}
                        onDataClick={handleDataClick}
                      />
                    ))}
                  </>
                )}

                {/* Net Total */}
                <tr className="bg-purple-100 border-t-2 border-purple-300">
                  <td className="px-4 py-4 font-bold text-purple-800">
                    {report.net_total.category}
                  </td>
                  {report.net_total.data.map((amount, index) => (
                    <td
                      key={index}
                      className={`px-3 py-4 text-right tabular-nums font-bold cursor-pointer hover:bg-purple-200 transition-colors ${
                        amount < 0 ? 'text-red-700' : 'text-purple-800'
                      }`}
                      onClick={() => handleDataClick(`Net Total - Month ${index + 1}`, report.net_total.modal[index] || [])}
                    >
                      {formatCurrency(amount)}
                    </td>
                  ))}
                  <td className={`px-3 py-4 text-right tabular-nums font-bold ${
                    report.net_total.average < 0 ? 'text-red-700' : 'text-purple-800'
                  }`}>
                    {formatCurrency(report.net_total.average)}
                  </td>
                  <td
                    className={`px-3 py-4 text-right tabular-nums font-bold cursor-pointer hover:bg-purple-200 transition-colors ${
                      report.net_total.total < 0 ? 'text-red-700' : 'text-purple-800'
                    }`}
                    onClick={() => handleDataClick('Net Total - All', report.net_total.all_modal || [])}
                  >
                    {formatCurrency(report.net_total.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        transactions={modalTransactions}
      />
    </div>
  )
}
