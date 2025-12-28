'use client'

import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { format, subDays } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Branch {
  id: number
  name: string
}

interface RequisitionExpenseChartProps {
  branches?: Branch[]
}

// Generate mock data for demonstration
const generateMockData = (mode: string, branch: string, filters: Record<string, boolean>) => {
  const labels: string[] = []
  const numPoints = mode === 'D' ? 30 : mode === 'W' ? 12 : mode === 'M' ? 12 : 5

  for (let i = numPoints - 1; i >= 0; i--) {
    if (mode === 'D') {
      labels.push(format(subDays(new Date(), i), 'MMM dd'))
    } else if (mode === 'M') {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      labels.push(format(date, 'MMM yy'))
    } else if (mode === 'Y') {
      labels.push(String(new Date().getFullYear() - i))
    } else {
      labels.push(`Week ${numPoints - i}`)
    }
  }

  const datasets: any[] = []

  // Generate expense line
  const expenseData = []
  for (let i = 0; i < numPoints; i++) {
    expenseData.push(Math.floor(Math.random() * 40000) + 5000)
  }
  datasets.push({
    type: 'line' as const,
    label: `${branch === 'All' ? 'All Branches' : branch} Expense`,
    data: expenseData,
    borderColor: '#475569',
    backgroundColor: '#475569',
    tension: 0.3,
  })

  // Generate requisition status bars
  if (filters.paid) {
    const paidData = []
    for (let i = 0; i < numPoints; i++) {
      paidData.push(Math.floor(Math.random() * 30000) + 5000)
    }
    datasets.push({
      type: 'bar' as const,
      label: 'Paid',
      data: paidData,
      backgroundColor: 'rgba(69, 208, 224, 0.5)',
      borderColor: 'rgba(69, 208, 224, 0.5)',
    })
  }

  if (filters.approved) {
    const approvedData = []
    for (let i = 0; i < numPoints; i++) {
      approvedData.push(Math.floor(Math.random() * 25000) + 3000)
    }
    datasets.push({
      type: 'bar' as const,
      label: 'Approved',
      data: approvedData,
      backgroundColor: 'rgba(9, 131, 176, 0.5)',
      borderColor: 'rgba(9, 131, 176, 0.5)',
    })
  }

  if (filters.submitted) {
    const submittedData = []
    for (let i = 0; i < numPoints; i++) {
      submittedData.push(Math.floor(Math.random() * 20000) + 2000)
    }
    datasets.push({
      type: 'bar' as const,
      label: 'Submitted',
      data: submittedData,
      backgroundColor: 'rgba(210, 47, 232, 0.5)',
      borderColor: 'rgba(210, 47, 232, 0.5)',
    })
  }

  if (filters.draft) {
    const draftData = []
    for (let i = 0; i < numPoints; i++) {
      draftData.push(Math.floor(Math.random() * 15000) + 1000)
    }
    datasets.push({
      type: 'bar' as const,
      label: 'Draft',
      data: draftData,
      backgroundColor: 'rgba(193, 196, 234, 0.5)',
      borderColor: 'rgba(193, 196, 234, 0.5)',
    })
  }

  return { labels, datasets }
}

export default function RequisitionExpenseChart({ branches }: RequisitionExpenseChartProps) {
  const [mode, setMode] = useState('D')
  const [branch, setBranch] = useState('All')
  const [filters, setFilters] = useState({
    draft: false,
    submitted: false,
    approved: true,
    paid: true,
  })
  const [chartData, setChartData] = useState(() => generateMockData('D', 'All', { draft: false, submitted: false, approved: true, paid: true }))

  const handleChange = (newMode: string, newBranch: string, newFilters: { draft: boolean; submitted: boolean; approved: boolean; paid: boolean }) => {
    setMode(newMode)
    setBranch(newBranch)
    setFilters(newFilters)
    setChartData(generateMockData(newMode, newBranch, newFilters))
  }

  const toggleFilter = (filter: string) => {
    const newFilters = { ...filters, [filter]: !filters[filter as keyof typeof filters] }
    handleChange(mode, branch, newFilters)
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

  // Mock branches for demonstration
  const mockBranches = [
    { id: 1, name: 'Bacolod' },
    { id: 2, name: 'Kabankalan' },
    { id: 3, name: 'Dumaguete' },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-700">Requisition vs Expense</h3>
          <div className="flex gap-2">
            <select
              value={mode}
              onChange={(e) => handleChange(e.target.value, branch, filters)}
              className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="D">Day</option>
              <option value="W">Week</option>
              <option value="M">Month</option>
              <option value="Y">Year</option>
            </select>
            <select
              value={branch}
              onChange={(e) => handleChange(mode, e.target.value, filters)}
              className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All</option>
              {(branches || mockBranches).map((b) => (
                <option key={b.id} value={b.name}>
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
      <Chart type="bar" options={options} data={chartData} />
    </div>
  )
}
