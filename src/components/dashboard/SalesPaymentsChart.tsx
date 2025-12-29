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
import { getSalesPayments, getBranches, type Branch } from '@/lib/services/dashboard'

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

export default function SalesPaymentsChart() {
  const [mode, setMode] = useState('D')
  const [branch, setBranch] = useState<number | 'All'>('All')
  const [branches, setBranches] = useState<Branch[]>([])
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    loadData()
  }, [mode, branch])

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
      const data = await getSalesPayments(mode, branch)

      const branchName = branch === 'All'
        ? 'All Branches'
        : branches.find(b => b.id === branch)?.name || 'Selected Branch'

      setChartData({
        labels: data.labels,
        datasets: [
          {
            type: 'line' as const,
            label: `${branchName} Sales`,
            data: data.salesData,
            borderColor: '#14b8a6',
            backgroundColor: '#14b8a6',
            tension: 0.3,
            yAxisID: 'y',
          },
          {
            type: 'bar' as const,
            label: `${branchName} Payments`,
            data: data.paymentsData,
            backgroundColor: 'rgba(20, 184, 166, 0.4)',
            borderColor: 'rgba(20, 184, 166, 0.4)',
            yAxisID: 'y',
          },
        ],
      })
    } catch (err) {
      console.error('Error loading sales/payments data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Sales vs Payments</h3>
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
