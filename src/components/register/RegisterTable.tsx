'use client'

import { useState, useEffect } from 'react'
import type { Register, Branch, Account, AccountCategory, Contact, RegisterFilters, WorkingBalance } from '@/types/register'
import {
  getRegisters,
  createRegister,
  updateRegister,
  deleteRegisters,
  updateTransactionStatus,
  getWorkingBalance,
  getBranches,
  getAccounts,
  getAccountCategories,
  getContacts
} from '@/lib/services/register'

interface RegisterTableProps {
  accountId: number | 'All'
  accountName: string
  isReconcilable?: boolean
}

export default function RegisterTable({ accountId, accountName, isReconcilable = true }: RegisterTableProps) {
  const [registers, setRegisters] = useState<Register[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<WorkingBalance>({ cleared: 0, uncleared: 0, working_balance: 0 })
  const [branches, setBranches] = useState<Branch[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [filters, setFilters] = useState<RegisterFilters>({
    sort: 'date',
    sortDirection: 'desc',
    search: '',
    account_id: accountId,
    date_from: null,
    date_to: null,
    showReconciled: true,
    showCleared: true,
    showUncleared: true,
    dateFilter: 'allDates',
    page: 1,
    items: 20,
  })

  const [newRegister, setNewRegister] = useState<Partial<Register>>({
    date: new Date().toISOString().split('T')[0],
    branch_id: null,
    account_id: accountId === 'All' ? null : accountId,
    transfer_account_id: null,
    category_id: null,
    contact_id: null,
    memo: '',
    check: '',
    or_number: '',
    inflow: 0,
    outflow: 0,
  })

  useEffect(() => {
    loadDropdowns()
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [filters])

  const loadDropdowns = async () => {
    try {
      const [branchesData, accountsData, categoriesData, contactsData] = await Promise.all([
        getBranches(),
        getAccounts(),
        getAccountCategories(),
        getContacts()
      ])
      setBranches(branchesData)
      setAccounts(accountsData)
      setCategories(categoriesData)
      setContacts(contactsData)
    } catch (error) {
      console.error('Error loading dropdowns:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [registersResult, balanceResult] = await Promise.all([
        getRegisters(filters),
        getWorkingBalance(accountId)
      ])
      setRegisters(registersResult.data)
      setTotalCount(registersResult.count || 0)
      setBalance(balanceResult)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      await createRegister({
        ...newRegister,
        account_id: accountId === 'All' ? newRegister.account_id : accountId
      })
      setIsAdding(false)
      setNewRegister({
        date: new Date().toISOString().split('T')[0],
        branch_id: null,
        account_id: accountId === 'All' ? null : accountId,
        transfer_account_id: null,
        category_id: null,
        contact_id: null,
        memo: '',
        check: '',
        or_number: '',
        inflow: 0,
        outflow: 0,
      })
      loadData()
    } catch (error) {
      console.error('Error creating register:', error)
    }
  }

  const handleUpdate = async (id: number, data: Partial<Register>) => {
    try {
      await updateRegister(id, data)
      setEditingId(null)
      loadData()
    } catch (error) {
      console.error('Error updating register:', error)
    }
  }

  const handleDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} selected transaction(s)?`)) return

    try {
      await deleteRegisters(selectedIds)
      setSelectedIds([])
      loadData()
    } catch (error) {
      console.error('Error deleting registers:', error)
    }
  }

  const toggleStatus = async (id: number, currentStatus: string) => {
    if (currentStatus === 'R') return // Can't change reconciled
    const newStatus = currentStatus === 'C' ? 'U' : 'C'
    try {
      await updateTransactionStatus([id], newStatus as 'U' | 'C')
      loadData()
    } catch (error) {
      console.error('Error updating status:', error)
    }
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
      setSelectedIds(registers.map(r => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sort !== column) return null
    return filters.sortDirection === 'asc' ? (
      <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Balance Summary */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-slate-800">{accountName}</h2>
          {isReconcilable && (
            <>
              <div className="text-center">
                <div className={`text-lg font-bold ${balance.cleared < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatCurrency(balance.cleared)}
                </div>
                <div className="text-xs text-slate-500">Cleared</div>
              </div>
              <span className="text-slate-400">+</span>
              <div className="text-center">
                <div className={`text-lg font-bold ${balance.uncleared < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatCurrency(balance.uncleared)}
                </div>
                <div className="text-xs text-slate-500">Uncleared</div>
              </div>
              <span className="text-slate-400">=</span>
            </>
          )}
          <div className="text-center">
            <div className={`text-xl font-bold ${balance.working_balance < 0 ? 'text-red-600' : 'text-teal-600'}`}>
              {formatCurrency(balance.working_balance)}
            </div>
            <div className="text-xs text-slate-500">Working Balance</div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-3 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Delete ({selectedIds.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.showCleared}
                onChange={(e) => setFilters(prev => ({ ...prev, showCleared: e.target.checked }))}
                className="rounded"
              />
              Cleared
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.showUncleared}
                onChange={(e) => setFilters(prev => ({ ...prev, showUncleared: e.target.checked }))}
                className="rounded"
              />
              Uncleared
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.showReconciled}
                onChange={(e) => setFilters(prev => ({ ...prev, showReconciled: e.target.checked }))}
                className="rounded"
              />
              Reconciled
            </label>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="px-3 py-1.5 border rounded text-sm w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-2 py-2 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === registers.length && registers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer hover:bg-slate-200"
                onClick={() => handleSort('date')}
              >
                Date <SortIcon column="date" />
              </th>
              <th
                className="px-3 py-2 text-left cursor-pointer hover:bg-slate-200"
                onClick={() => handleSort('branch_id')}
              >
                Branch <SortIcon column="branch_id" />
              </th>
              <th className="px-3 py-2 text-left">Transfer</th>
              {accountId === 'All' && <th className="px-3 py-2 text-left">Account</th>}
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-left">Memo</th>
              <th className="px-3 py-2 text-left">Check</th>
              <th className="px-3 py-2 text-left">OR</th>
              <th className="px-3 py-2 text-right">Outflow</th>
              <th className="px-3 py-2 text-right">Inflow</th>
              {isReconcilable && <th className="px-3 py-2 text-center w-12">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Add New Row */}
            {isAdding && (
              <tr className="bg-teal-50">
                <td className="px-2 py-2"></td>
                <td className="px-2 py-1">
                  <input
                    type="date"
                    value={newRegister.date}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    value={newRegister.branch_id || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, branch_id: Number(e.target.value) || null }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select
                    value={newRegister.transfer_account_id || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, transfer_account_id: Number(e.target.value) || null }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">None</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.account_name}</option>
                    ))}
                  </select>
                </td>
                {accountId === 'All' && (
                  <td className="px-2 py-1">
                    <select
                      value={newRegister.account_id || ''}
                      onChange={(e) => setNewRegister(prev => ({ ...prev, account_id: Number(e.target.value) || null }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="">Select...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.account_name}</option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-2 py-1">
                  <select
                    value={newRegister.category_id || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, category_id: Number(e.target.value) || null }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select
                    value={newRegister.contact_id || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, contact_id: Number(e.target.value) || null }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company || `${c.first_name || ''} ${c.last_name || ''}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={newRegister.memo || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="Memo"
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={newRegister.check || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, check: e.target.value }))}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={newRegister.or_number || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, or_number: e.target.value }))}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    value={newRegister.outflow || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, outflow: Number(e.target.value), inflow: 0 }))}
                    className="w-24 px-2 py-1 border rounded text-sm text-right"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    value={newRegister.inflow || ''}
                    onChange={(e) => setNewRegister(prev => ({ ...prev, inflow: Number(e.target.value), outflow: 0 }))}
                    className="w-24 px-2 py-1 border rounded text-sm text-right"
                  />
                </td>
                {isReconcilable && <td></td>}
              </tr>
            )}
            {isAdding && (
              <tr className="bg-teal-50">
                <td colSpan={12} className="px-3 py-2 text-right">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700"
                  >
                    Save
                  </button>
                </td>
              </tr>
            )}

            {/* Loading */}
            {loading && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!loading && registers.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                  No transactions found
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading && registers.map((reg) => (
              <tr key={reg.id} className="hover:bg-slate-50">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(reg.id)}
                    onChange={(e) => handleSelect(reg.id, e.target.checked)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-2">{reg.date}</td>
                <td className="px-3 py-2">{reg.branch_name}</td>
                <td className="px-3 py-2 text-slate-500">{reg.transfer_account_name}</td>
                {accountId === 'All' && <td className="px-3 py-2">{reg.account_name}</td>}
                <td className="px-3 py-2">{reg.category_name}</td>
                <td className="px-3 py-2">{reg.contact_name}</td>
                <td className="px-3 py-2">{reg.memo}</td>
                <td className="px-3 py-2">{reg.check}</td>
                <td className="px-3 py-2">{reg.or_number}</td>
                <td className="px-3 py-2 text-right text-red-600">
                  {reg.outflow && reg.outflow > 0 ? formatCurrency(reg.outflow) : ''}
                </td>
                <td className="px-3 py-2 text-right text-green-600">
                  {reg.inflow && reg.inflow > 0 ? formatCurrency(reg.inflow) : ''}
                </td>
                {isReconcilable && (
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleStatus(reg.id, reg.transaction_status)}
                      className={`text-lg ${
                        reg.transaction_status === 'R' ? 'text-red-500 cursor-not-allowed' :
                        reg.transaction_status === 'C' ? 'text-teal-600' : 'text-slate-300'
                      }`}
                      disabled={reg.transaction_status === 'R'}
                      title={
                        reg.transaction_status === 'R' ? 'Reconciled (Locked)' :
                        reg.transaction_status === 'C' ? 'Cleared' : 'Uncleared'
                      }
                    >
                      {reg.transaction_status === 'R' ? '🔒' :
                       reg.transaction_status === 'C' ? '©' : '○'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-3 border-t flex items-center justify-between text-sm text-slate-600">
        <div>
          Showing {registers.length} of {totalCount} transactions
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.items}
            onChange={(e) => setFilters(prev => ({ ...prev, items: Number(e.target.value), page: 1 }))}
            className="px-2 py-1 border rounded"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {filters.page}</span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={registers.length < filters.items}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
