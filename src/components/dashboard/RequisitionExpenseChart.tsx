'use client'

import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { getRequisitionExpense, getBranches, type Branch } from '@/lib/services/dashboard'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
)

export default function RequisitionExpenseChart() {
  const [mode, setMode] = useState('D')
  const [branch, setBranch] = useState<number | 'All'>('All')
  const [branches, setBranches] = useState<Branch[]>([])
  const [filters, setFilters] = useState({
    draft: false,
    submitted: false,
    approved: true,
    paid: true,
  })
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    loadData()
  }, [mode, branch, filters])

  const loadBranches = async () => {
    try {
      const data = await getBranches()
      setBranches(data)
    } catch (err) {
      console.error('Error loading branches:', err)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRequisitionExpense(mode, branch, filters)

      const branchName = branch === 'All'
        ? 'All Branches'
        : branches.find(b => b.id === branch)?.name || 'Selected Branch'

      const datasets: any[] = []

      // Expense line (always shown)
      datasets.push({
        type: 'line' as const,
        label: `${branchName} Expense`,
        data: data.expense,
        borderColor: '#475569',
        backgroundColor: '#475569',
        tension: 0.3,
      })

      // Requisition status bars based on filters
      if (filters.paid) {
        datasets.push({
          type: 'bar' as const,
          label: 'Paid',
          data: data.paid,
          backgroundColor: 'rgba(69, 208, 224, 0.5)',
          borderColor: 'rgba(69, 208, 224, 0.5)',
        })
      }

      if (filters.approved) {
        datasets.push({
          type: 'bar' as const,
          label: 'Approved',
          data: data.approved,
          backgroundColor: 'rgba(9, 131, 176, 0.5)',
          borderColor: 'rgba(9, 131, 176, 0.5)',
        })
      }

      if (filters.submitted) {
        datasets.push({
          type: 'bar' as const,
          label: 'Submitted',
          data: data.submitted,
          backgroundColor: 'rgba(210, 47, 232, 0.5)',
          borderColor: 'rgba(210, 47, 232, 0.5)',
        })
      }

      if (filters.draft) {
        datasets.push({
          type: 'bar' as const,
          label: 'Draft',
          data: data.draft,
          backgroundColor: 'rgba(193, 196, 234, 0.5)',
          borderColor: 'rgba(193, 196, 234, 0.5)',
        })
      }

      setChartData({
        labels: data.labels,
        datasets,
      })
    } catch (err) {
      console.error('Error loading requisition/expense data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const toggleFilter = (filter: string) => {
    setFilters(prev => ({ ...prev, [filter]: !prev[filter as keyof typeof prev] }))
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-PH').format(value)
          }
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-700">Requisition vs Expense</h3>
          <div className="flex gap-2">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="D">Day</option>
              <option value="W">Week</option>
              <option value="M">Month</option>
              <option value="Y">Year</option>
            </select>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {['draft', 'submitted', 'approved', 'paid'].map((status) => (
            <label key={status} className="flex items-center gap-1 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters[status as keyof typeof filters]}
                onChange={() => toggleFilter(status)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </label>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-red-500">
          {error}
        </div>
      ) : (
        <Chart type="bar" options={options} data={chartData} />
      )}
    </div>
  )
}
