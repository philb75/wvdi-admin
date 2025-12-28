import { createClient } from '@/lib/supabase/client'
import type {
  IncomeExpenseFilters,
  IncomeExpenseReport,
  CategoryData,
  Transaction,
  BranchOption,
  AccountOption,
  CategoryFilterData,
  AccountCategoryGroup
} from '@/types/income-expense'

const supabase = createClient()

// Helper to get months array between two dates
function getMonthsArray(from: string, to: string, format: 'display' | 'query' = 'display'): string[] {
  const months: string[] = []
  const startDate = new Date(from)
  const endDate = new Date(to)

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (current <= end) {
    if (format === 'display') {
      months.push(current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
    } else {
      months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
    }
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

// Format amount to 2 decimal places
function formatAmount(num: number): number {
  return parseFloat(num.toFixed(2))
}

// Get all account categories grouped for filter
export async function getCategoryFilters(): Promise<CategoryFilterData> {
  try {
    const { data, error } = await supabase
      .from('w_account_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return { income: [], expense: [], other: [] }
    }

    // Group by revenue_type and then by category/name
    const income: AccountCategoryGroup[] = []
    const expense: AccountCategoryGroup[] = []
    const other: AccountCategoryGroup[] = []

    // Group categories
    const incomeGroups = new Map<string, { id: number; type: string }[]>()
    const expenseGroups = new Map<string, { id: number; type: string }[]>()
    const otherGroups = new Map<string, { id: number; type: string }[]>()

    ;(data || []).forEach((cat: any) => {
      // Skip parent categories (those without parent_id) - they're just groupings
      if (cat.parent_id === null) return

      const categoryName = cat.name || 'Uncategorized'
      const typeName = cat.type || cat.name || 'General'
      const item = { id: cat.id, type: categoryName }

      // 'R' = Revenue (Income), 'E' = Expense, null = Other/Assets
      if (cat.revenue_type === 'R') {
        const existing = incomeGroups.get(typeName) || []
        existing.push(item)
        incomeGroups.set(typeName, existing)
      } else if (cat.revenue_type === 'E') {
        const existing = expenseGroups.get(typeName) || []
        existing.push(item)
        expenseGroups.set(typeName, existing)
      } else {
        // null or other revenue types go to 'other' group
        const existing = otherGroups.get(typeName) || []
        existing.push(item)
        otherGroups.set(typeName, existing)
      }
    })

    // Convert to arrays
    incomeGroups.forEach((sub_categories, name) => {
      income.push({
        name,
        sub_categories,
        isSelected: true,
        selected_sub_categories: sub_categories.map(s => s.id)
      })
    })

    expenseGroups.forEach((sub_categories, name) => {
      expense.push({
        name,
        sub_categories,
        isSelected: true,
        selected_sub_categories: sub_categories.map(s => s.id)
      })
    })

    otherGroups.forEach((sub_categories, name) => {
      other.push({
        name,
        sub_categories,
        isSelected: false, // Others unselected by default
        selected_sub_categories: []
      })
    })

    return { income, expense, other }
  } catch (err) {
    console.error('Error in getCategoryFilters:', err)
    return { income: [], expense: [], other: [] }
  }
}

// Get branches for filter
export async function getBranchOptions(): Promise<BranchOption[]> {
  try {
    const { data, error } = await supabase
      .from('w_branches')
      .select('id, name')
      .eq('status', 'A')
      .order('name')

    if (error) {
      console.error('Error fetching branches:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Error in getBranchOptions:', err)
    return []
  }
}

// Get accounts for filter (excluding Finance accounts)
export async function getAccountOptions(): Promise<AccountOption[]> {
  try {
    const { data, error } = await supabase
      .from('w_accounts')
      .select('id, account_name')
      .eq('status', 'A')
      .order('account_name')

    if (error) {
      console.error('Error fetching accounts:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Error in getAccountOptions:', err)
    return []
  }
}

// Main function to get the income expense report
export async function getIncomeExpenseReport(filters: IncomeExpenseFilters): Promise<IncomeExpenseReport> {
  const queryMonths = getMonthsArray(filters.date_from, filters.date_to, 'query')
  const displayMonths = getMonthsArray(filters.date_from, filters.date_to, 'display')

  // Default empty report
  const emptyReport: IncomeExpenseReport = {
    income: [],
    expense: [],
    others: [],
    net_total: {
      category: 'Net Total',
      data: displayMonths.map(() => 0),
      modal: displayMonths.map(() => []),
      all_modal: [],
      average: 0,
      total: 0,
      is_category: false
    },
    headers: displayMonths
  }

  try {
    // Fetch all transactions for the date range
    const { data: transactions, error } = await supabase
      .from('w_register')
      .select(`
        id,
        date,
        memo,
        amount,
        category_id,
        branch_id,
        account_id,
        contact_id,
        w_branches!w_register_branch_id_fkey (name),
        w_accounts!w_register_account_id_fkey (account_name),
        w_contacts!w_register_contact_id_fkey (first_name, last_name)
      `)
      .gte('date', filters.date_from)
      .lte('date', filters.date_to)
      .in('branch_id', filters.branches)
      .in('account_id', filters.accounts)

    if (error) {
      console.error('Error fetching transactions:', error)
      return emptyReport
    }

    // Transform transactions
    const allTransactions: Transaction[] = (transactions || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      memo: t.memo,
      amount: t.amount || 0,
      inflow: (t.amount || 0) > 0 ? t.amount : 0,
      outflow: (t.amount || 0) < 0 ? Math.abs(t.amount) : 0,
      branch_name: t.w_branches?.name || null,
      account_name: t.w_accounts?.account_name || null,
      contact_name: t.w_contacts ? `${t.w_contacts.first_name || ''} ${t.w_contacts.last_name || ''}`.trim() || null : null,
      category_id: t.category_id,
      service_code: null,
      transfer: null
    }))

    // Organize transactions by month and category
    const organizedData = new Map<string, Map<number | null, Transaction[]>>()

    queryMonths.forEach(month => {
      organizedData.set(month, new Map())
    })

    allTransactions.forEach(t => {
      const month = t.date.substring(0, 7) // YYYY-MM
      const monthData = organizedData.get(month)
      if (monthData) {
        const existing = monthData.get(t.category_id) || []
        existing.push(t)
        monthData.set(t.category_id, existing)
      }
    })

    // Fetch category info for selected categories
    const { data: categories } = await supabase
      .from('w_account_categories')
      .select('*')
      .in('id', filters.categories.length > 0 ? filters.categories : [0])

    // Group categories by revenue type ('R' = Revenue/Income, 'E' = Expense, null = Other/Assets)
    const incomeCategories = (categories || []).filter((c: any) => c.revenue_type === 'R')
    const expenseCategories = (categories || []).filter((c: any) => c.revenue_type === 'E')
    const otherCategories = (categories || []).filter((c: any) => c.revenue_type === null || (c.revenue_type !== 'R' && c.revenue_type !== 'E'))

    // Process each group into CategoryData
    const income = processSimpleCategories(incomeCategories, queryMonths, organizedData)
    const expense = processSimpleCategories(expenseCategories, queryMonths, organizedData)
    const others = processSimpleCategories(otherCategories, queryMonths, organizedData)

    // Add uncategorized if requested
    if (filters.uncategorized) {
      const uncategorizedIncome = processUncategorized('Uncategorized Income', queryMonths, organizedData, true)
      const uncategorizedExpense = processUncategorized('Uncategorized Expense', queryMonths, organizedData, false)

      if (uncategorizedIncome.total !== 0) income.unshift(uncategorizedIncome)
      if (uncategorizedExpense.total !== 0) expense.unshift(uncategorizedExpense)
    }

    // Calculate totals
    const incomeTotal = calculateTotal('Total Income', income, queryMonths.length)
    const expenseTotal = calculateTotal('Total Expense', expense, queryMonths.length)
    const othersTotal = calculateTotal('Total Others', others, queryMonths.length)

    income.push(incomeTotal)
    expense.push(expenseTotal)
    if (others.length > 0) others.push(othersTotal)

    // Calculate net total
    const netTotal = calculateNetTotal(incomeTotal, expenseTotal, othersTotal, queryMonths.length)

    return {
      income,
      expense,
      others,
      net_total: netTotal,
      headers: displayMonths
    }
  } catch (err) {
    console.error('Error in getIncomeExpenseReport:', err)
    return emptyReport
  }
}

function processSimpleCategories(
  categories: any[],
  months: string[],
  organizedData: Map<string, Map<number | null, Transaction[]>>
): CategoryData[] {
  return categories.map(cat => {
    const data: number[] = []
    const modal: Transaction[][] = []
    let total = 0

    months.forEach(month => {
      const monthData = organizedData.get(month)
      const transactions = monthData?.get(cat.id) || []
      const amount = transactions.reduce((sum, t) => sum + t.amount, 0)

      data.push(formatAmount(amount))
      modal.push(transactions)
      total += amount
    })

    return {
      category: cat.name || cat.category || cat.type || `Category ${cat.id}`,
      data,
      modal,
      all_modal: modal.flat(),
      average: formatAmount(months.length > 0 ? total / months.length : 0),
      total: formatAmount(total),
      is_category: true
    }
  })
}

function processUncategorized(
  name: string,
  months: string[],
  organizedData: Map<string, Map<number | null, Transaction[]>>,
  isIncome: boolean
): CategoryData {
  const data: number[] = []
  const modal: Transaction[][] = []
  let total = 0

  months.forEach(month => {
    const monthData = organizedData.get(month)
    const transactions = (monthData?.get(null) || []).filter(t =>
      isIncome ? t.amount > 0 : t.amount < 0
    )
    const amount = transactions.reduce((sum, t) => sum + t.amount, 0)

    data.push(formatAmount(amount))
    modal.push(transactions)
    total += amount
  })

  return {
    category: name,
    data,
    modal,
    all_modal: modal.flat(),
    average: formatAmount(months.length > 0 ? total / months.length : 0),
    total: formatAmount(total),
    is_category: false,
    sub_category: []
  }
}

function calculateTotal(name: string, categories: CategoryData[], monthCount: number): CategoryData {
  const data: number[] = new Array(monthCount).fill(0)
  const modal: Transaction[][] = new Array(monthCount).fill(null).map(() => [])

  categories.forEach(cat => {
    if (cat.category.startsWith('Total')) return // Skip existing totals

    cat.data.forEach((amount, index) => {
      data[index] += amount
    })

    cat.modal.forEach((transactions, index) => {
      modal[index].push(...transactions)
    })
  })

  const total = data.reduce((sum, amount) => sum + amount, 0)

  return {
    category: name,
    data: data.map(d => formatAmount(d)),
    modal,
    all_modal: modal.flat(),
    average: formatAmount(monthCount > 0 ? total / monthCount : 0),
    total: formatAmount(total),
    is_category: false,
    sub_category: []
  }
}

function calculateNetTotal(
  income: CategoryData,
  expense: CategoryData,
  others: CategoryData,
  monthCount: number
): CategoryData {
  const data: number[] = []
  const modal: Transaction[][] = []

  for (let i = 0; i < monthCount; i++) {
    const netAmount = (income.data[i] || 0) + (expense.data[i] || 0) + (others.data[i] || 0)
    data.push(formatAmount(netAmount))

    const transactions = [
      ...(income.modal[i] || []),
      ...(expense.modal[i] || []),
      ...(others.modal[i] || [])
    ]
    modal.push(transactions)
  }

  const total = data.reduce((sum, amount) => sum + amount, 0)

  return {
    category: 'Net Total',
    data,
    modal,
    all_modal: modal.flat(),
    average: formatAmount(monthCount > 0 ? total / monthCount : 0),
    total: formatAmount(total),
    is_category: false,
    sub_category: []
  }
}

// Export report to CSV
export function exportReportToCSV(report: IncomeExpenseReport, filename: string = 'income-expense-report.csv') {
  const rows: string[][] = []

  // Headers
  rows.push(['Category', ...report.headers, 'Average', 'Total'])

  // Helper to add section
  const addSection = (title: string, categories: CategoryData[]) => {
    rows.push([title])

    categories.forEach(cat => {
      rows.push([
        cat.category,
        ...cat.data.map(d => d.toString()),
        cat.average.toString(),
        cat.total.toString()
      ])

      // Add subcategories
      cat.sub_category?.forEach(subCat => {
        rows.push([
          `  ${subCat.category}`,
          ...subCat.data.map(d => d.toString()),
          subCat.average.toString(),
          subCat.total.toString()
        ])
      })
    })

    rows.push([]) // Empty row
  }

  addSection('INCOME', report.income)
  addSection('EXPENSE', report.expense)
  if (report.others.length > 0) {
    addSection('OTHERS', report.others)
  }

  // Net total
  rows.push([
    report.net_total.category,
    ...report.net_total.data.map(d => d.toString()),
    report.net_total.average.toString(),
    report.net_total.total.toString()
  ])

  // Convert to CSV
  const csvContent = rows.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
