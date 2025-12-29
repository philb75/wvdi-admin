import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfMonth, subMonths, subYears, startOfYear, endOfMonth, startOfWeek, endOfWeek, subWeeks } from 'date-fns'

const supabase = createClient()

export interface Branch {
  id: number
  name: string
  branch_color: string | null
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface SalesChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension: number
  }[]
}

export interface SalesPaymentsData {
  labels: string[]
  salesData: number[]
  paymentsData: number[]
}

export interface RequisitionExpenseData {
  labels: string[]
  expense: number[]
  draft: number[]
  submitted: number[]
  approved: number[]
  paid: number[]
}

// Get active branches with colors
export async function getBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('w_branches')
    .select('id, name, branch_color')
    .eq('status', 'A')
    .order('name')

  if (error) throw error
  return data || []
}

// Generate date ranges based on mode
function getDateRanges(mode: string): { dates: Date[], labels: string[] } {
  const dates: Date[] = []
  const labels: string[] = []
  const now = new Date()

  switch (mode) {
    case 'D': // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = subDays(now, i)
        dates.push(date)
        labels.push(format(date, 'MMM dd'))
      }
      break
    case 'W': // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const date = subWeeks(now, i)
        dates.push(startOfWeek(date))
        labels.push(`Week ${12 - i}`)
      }
      break
    case 'M': // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i)
        dates.push(startOfMonth(date))
        labels.push(format(date, 'MMM yy'))
      }
      break
    case 'Y': // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const date = subYears(now, i)
        dates.push(startOfYear(date))
        labels.push(format(date, 'yyyy'))
      }
      break
  }

  return { dates, labels }
}

// Get date filter condition
function getDateFilter(mode: string, date: Date): { from: string, to: string } {
  switch (mode) {
    case 'D':
      const dayStr = format(date, 'yyyy-MM-dd')
      return { from: dayStr, to: dayStr }
    case 'W':
      return {
        from: format(startOfWeek(date), 'yyyy-MM-dd'),
        to: format(endOfWeek(date), 'yyyy-MM-dd')
      }
    case 'M':
      return {
        from: format(startOfMonth(date), 'yyyy-MM-dd'),
        to: format(endOfMonth(date), 'yyyy-MM-dd')
      }
    case 'Y':
      return {
        from: format(startOfYear(date), 'yyyy-MM-dd'),
        to: format(new Date(date.getFullYear(), 11, 31), 'yyyy-MM-dd')
      }
    default:
      return { from: format(date, 'yyyy-MM-dd'), to: format(date, 'yyyy-MM-dd') }
  }
}

// Get Sales by Branch for multi-line chart
export async function getSalesByBranch(mode: string = 'D'): Promise<SalesChartData> {
  const { dates, labels } = getDateRanges(mode)
  const branches = await getBranches()

  const datasets = []

  for (const branch of branches) {
    const data: number[] = []

    for (const date of dates) {
      const { from, to } = getDateFilter(mode, date)

      // Query sales: register entries with positive amount and service_id
      const { data: salesData, error } = await supabase
        .from('w_register')
        .select('amount')
        .eq('branch_id', branch.id)
        .gte('date', from)
        .lte('date', to)
        .not('service_id', 'is', null)
        .gt('amount', 0)

      if (error) {
        console.error('Error fetching sales:', error)
        data.push(0)
        continue
      }

      const total = (salesData || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      data.push(total)
    }

    const color = branch.branch_color ? `#${branch.branch_color}` : '#10b981'
    datasets.push({
      label: `${branch.name} Sales`,
      data,
      borderColor: color,
      backgroundColor: color,
      tension: 0.3
    })
  }

  return { labels, datasets }
}

// Get Sales and Payments for combo chart
export async function getSalesPayments(mode: string = 'D', branchId: number | 'All' = 'All'): Promise<SalesPaymentsData> {
  const { dates, labels } = getDateRanges(mode)
  const salesData: number[] = []
  const paymentsData: number[] = []

  for (const date of dates) {
    const { from, to } = getDateFilter(mode, date)

    // Query for sales (positive amounts with service_id)
    let salesQuery = supabase
      .from('w_register')
      .select('amount')
      .gte('date', from)
      .lte('date', to)
      .not('service_id', 'is', null)
      .gt('amount', 0)

    if (branchId !== 'All') {
      salesQuery = salesQuery.eq('branch_id', branchId)
    }

    const { data: sales, error: salesError } = await salesQuery

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      salesData.push(0)
    } else {
      const salesTotal = (sales || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      salesData.push(salesTotal)
    }

    // Query for payments (negative amounts without service_id - student payments)
    let paymentsQuery = supabase
      .from('w_register')
      .select('amount')
      .gte('date', from)
      .lte('date', to)
      .is('service_id', null)
      .lt('amount', 0)

    if (branchId !== 'All') {
      paymentsQuery = paymentsQuery.eq('branch_id', branchId)
    }

    const { data: payments, error: paymentsError } = await paymentsQuery

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      paymentsData.push(0)
    } else {
      // Payments are negative, so we negate them to show as positive
      const paymentsTotal = (payments || []).reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0)
      paymentsData.push(paymentsTotal)
    }
  }

  return { labels, salesData, paymentsData }
}

// Get Requisition vs Expense data
export async function getRequisitionExpense(
  mode: string = 'D',
  branchId: number | 'All' = 'All',
  filters: { draft: boolean; submitted: boolean; approved: boolean; paid: boolean }
): Promise<RequisitionExpenseData> {
  const { dates, labels } = getDateRanges(mode)
  const expense: number[] = []
  const draft: number[] = []
  const submitted: number[] = []
  const approved: number[] = []
  const paid: number[] = []

  for (const date of dates) {
    const { from, to } = getDateFilter(mode, date)

    // Query for expenses from register (negative amounts for expense categories)
    let expenseQuery = supabase
      .from('w_register')
      .select('amount, w_account_categories!w_register_category_id_fkey(revenue_type)')
      .gte('date', from)
      .lte('date', to)
      .lt('amount', 0)

    if (branchId !== 'All') {
      expenseQuery = expenseQuery.eq('branch_id', branchId)
    }

    const { data: expenseData, error: expenseError } = await expenseQuery

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError)
      expense.push(0)
    } else {
      // Filter for expense categories (revenue_type = 'E')
      const expenseTotal = (expenseData || [])
        .filter((item: any) => item.w_account_categories?.revenue_type === 'E')
        .reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0)
      expense.push(expenseTotal)
    }

    // Query requisitions by status
    for (const status of ['Draft', 'Submitted', 'Approved', 'Paid']) {
      if (
        (status === 'Draft' && !filters.draft) ||
        (status === 'Submitted' && !filters.submitted) ||
        (status === 'Approved' && !filters.approved) ||
        (status === 'Paid' && !filters.paid)
      ) {
        if (status === 'Draft') draft.push(0)
        else if (status === 'Submitted') submitted.push(0)
        else if (status === 'Approved') approved.push(0)
        else if (status === 'Paid') paid.push(0)
        continue
      }

      let reqQuery = supabase
        .from('w_requisition')
        .select('amount')
        .eq('status', status)
        .gte('date', from)
        .lte('date', to)

      if (branchId !== 'All') {
        reqQuery = reqQuery.eq('branch_id', branchId)
      }

      const { data: reqData, error: reqError } = await reqQuery

      if (reqError) {
        console.error(`Error fetching ${status} requisitions:`, reqError)
        if (status === 'Draft') draft.push(0)
        else if (status === 'Submitted') submitted.push(0)
        else if (status === 'Approved') approved.push(0)
        else if (status === 'Paid') paid.push(0)
      } else {
        const total = (reqData || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        if (status === 'Draft') draft.push(total)
        else if (status === 'Submitted') submitted.push(total)
        else if (status === 'Approved') approved.push(total)
        else if (status === 'Paid') paid.push(total)
      }
    }
  }

  return { labels, expense, draft, submitted, approved, paid }
}

// Get dashboard summary stats
export async function getDashboardStats(branchIds?: number[]) {
  // Today's date
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd')

  // Today's sales
  let todaySalesQuery = supabase
    .from('w_register')
    .select('amount')
    .eq('date', today)
    .not('service_id', 'is', null)
    .gt('amount', 0)

  if (branchIds && branchIds.length > 0) {
    todaySalesQuery = todaySalesQuery.in('branch_id', branchIds)
  }

  const { data: todaySales } = await todaySalesQuery
  const todaySalesTotal = (todaySales || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  // Month's sales
  let monthSalesQuery = supabase
    .from('w_register')
    .select('amount')
    .gte('date', monthStart)
    .lte('date', today)
    .not('service_id', 'is', null)
    .gt('amount', 0)

  if (branchIds && branchIds.length > 0) {
    monthSalesQuery = monthSalesQuery.in('branch_id', branchIds)
  }

  const { data: monthSales } = await monthSalesQuery
  const monthSalesTotal = (monthSales || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  // Year's sales
  let yearSalesQuery = supabase
    .from('w_register')
    .select('amount')
    .gte('date', yearStart)
    .lte('date', today)
    .not('service_id', 'is', null)
    .gt('amount', 0)

  if (branchIds && branchIds.length > 0) {
    yearSalesQuery = yearSalesQuery.in('branch_id', branchIds)
  }

  const { data: yearSales } = await yearSalesQuery
  const yearSalesTotal = (yearSales || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  // Pending requisitions
  let pendingReqQuery = supabase
    .from('w_requisition')
    .select('amount')
    .in('status', ['Draft', 'Submitted'])

  if (branchIds && branchIds.length > 0) {
    pendingReqQuery = pendingReqQuery.in('branch_id', branchIds)
  }

  const { data: pendingReq } = await pendingReqQuery
  const pendingReqTotal = (pendingReq || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return {
    todaySales: todaySalesTotal,
    monthSales: monthSalesTotal,
    yearSales: yearSalesTotal,
    pendingRequisitions: pendingReqTotal
  }
}
