'use client'

import dynamic from 'next/dynamic'

// Dynamic imports for chart components to avoid SSR issues with Chart.js
const SalesChart = dynamic(() => import('@/components/dashboard/SalesChart'), { ssr: false })
const SalesPaymentsChart = dynamic(() => import('@/components/dashboard/SalesPaymentsChart'), { ssr: false })
const RequisitionExpenseChart = dynamic(() => import('@/components/dashboard/RequisitionExpenseChart'), { ssr: false })

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <nav className="text-sm text-slate-500">
          <span>Dashboard</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SalesChart />
        <SalesPaymentsChart />
        <RequisitionExpenseChart />
      </div>
    </div>
  )
}
