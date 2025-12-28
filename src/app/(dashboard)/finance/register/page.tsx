'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAccounts, getBranches, getWorkingBalance } from '@/lib/services/register'
import type { Account, Branch, WorkingBalance } from '@/types/register'
import RegisterTable from '@/components/register/RegisterTable'

interface AccountWithBalance extends Account {
  balance: number
  category_name?: string
}

interface BranchCash {
  id: number
  name: string
  balance: number
}

export default function RegisterPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [branches, setBranches] = useState<BranchCash[]>([])
  const [selectedAccount, setSelectedAccount] = useState<number | 'All'>('All')
  const [selectedAccountName, setSelectedAccountName] = useState<string>('All Accounts')
  const [loading, setLoading] = useState(true)
  const [allAccountsBalance, setAllAccountsBalance] = useState<WorkingBalance>({
    cleared: 0,
    uncleared: 0,
    working_balance: 0
  })

  useEffect(() => {
    loadAccountsWithBalances()
  }, [])

  const loadAccountsWithBalances = async () => {
    setLoading(true)
    try {
      const [accountsData, branchesData, allBalance] = await Promise.all([
        getAccounts(),
        getBranches(),
        getWorkingBalance('All')
      ])

      setAllAccountsBalance(allBalance)

      // Get balances for each account (exclude Finance category)
      const accountsWithBalances = await Promise.all(
        accountsData
          .filter(a => a.category_name !== 'Finance')
          .map(async (account) => {
            const balance = await getWorkingBalance(account.id)
            return { ...account, balance: balance.working_balance }
          })
      )

      // Get cash balances for each branch
      const supabase = createClient()
      const cashAccount = accountsData.find(a => a.account_name === 'Cash')

      if (cashAccount) {
        const branchCashBalances = await Promise.all(
          branchesData.map(async (branch) => {
            const { data } = await supabase
              .from('w_register')
              .select('amount')
              .eq('account_id', cashAccount.id)
              .eq('branch_id', branch.id)

            const balance = (data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
            return { id: branch.id, name: branch.name, balance }
          })
        )
        setBranches(branchCashBalances)
      }

      setAccounts(accountsWithBalances)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectAccount = (id: number | 'All', name: string) => {
    setSelectedAccount(id)
    setSelectedAccountName(name)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })
  }

  // Group accounts by category name
  const cashAccounts = accounts.filter(a => a.category_name === 'Cash' && a.account_name !== 'Cash')
  const bankAccounts = accounts.filter(a => a.category_name === 'Bank')
  const otherAccounts = accounts.filter(a => !['Cash', 'Bank', 'Finance'].includes(a.category_name || ''))

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar - Account List */}
      <div className="w-64 bg-white border-r overflow-y-auto flex-shrink-0">
        <div className="p-3 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Accounts
          </h3>
        </div>

        <nav className="p-2">
          {/* All Accounts */}
          <button
            onClick={() => selectAccount('All', 'All Accounts')}
            className={`w-full px-3 py-2 rounded text-left text-sm flex justify-between items-center ${
              selectedAccount === 'All' ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              All Accounts
            </span>
            <span className={`font-medium ${allAccountsBalance.working_balance < 0 ? 'text-red-600' : 'text-teal-600'}`}>
              {formatCurrency(allAccountsBalance.working_balance)}
            </span>
          </button>

          {/* Cash by Branch */}
          {branches.length > 0 && (
            <div className="mt-3">
              <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">Cash by Branch</div>
              {branches.map(branch => (
                <button
                  key={`cash-${branch.id}`}
                  onClick={() => selectAccount(branch.id, `Cash (${branch.name})`)}
                  className={`w-full px-3 py-2 rounded text-left text-sm flex justify-between items-center ${
                    selectedAccount === branch.id ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    Cash {branch.name}
                  </span>
                  <span className={`font-medium ${branch.balance < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(branch.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Cash Accounts */}
          {cashAccounts.length > 0 && (
            <div className="mt-3">
              <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">Cash</div>
              {cashAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => selectAccount(account.id, account.account_name)}
                  className={`w-full px-3 py-2 rounded text-left text-sm flex justify-between items-center ${
                    selectedAccount === account.id ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    {account.account_name}
                  </span>
                  <span className={`font-medium ${account.balance < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(account.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Bank Accounts */}
          {bankAccounts.length > 0 && (
            <div className="mt-3">
              <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">Bank</div>
              {bankAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => selectAccount(account.id, account.account_name)}
                  className={`w-full px-3 py-2 rounded text-left text-sm flex justify-between items-center ${
                    selectedAccount === account.id ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {account.account_name}
                  </span>
                  <span className={`font-medium ${account.balance < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(account.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Other Accounts */}
          {otherAccounts.length > 0 && (
            <div className="mt-3">
              <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">Other</div>
              {otherAccounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => selectAccount(account.id, account.account_name)}
                  className={`w-full px-3 py-2 rounded text-left text-sm flex justify-between items-center ${
                    selectedAccount === account.id ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    {account.account_name}
                  </span>
                  <span className={`font-medium ${account.balance < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(account.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {loading && (
          <div className="p-4 text-center text-slate-500 text-sm">
            Loading accounts...
          </div>
        )}
      </div>

      {/* Main Content - Register Table */}
      <div className="flex-1 p-4 overflow-auto bg-slate-100">
        <RegisterTable
          key={selectedAccount}
          accountId={selectedAccount}
          accountName={selectedAccountName}
          isReconcilable={selectedAccount !== 'All'}
        />
      </div>
    </div>
  )
}
