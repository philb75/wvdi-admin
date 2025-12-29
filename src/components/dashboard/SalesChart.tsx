'use client'

import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getSalesByBranch, type SalesChartData } from '@/lib/services/dashboard'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function SalesChart() {
  const [mode, setMode] = useState('D')
  const [chartData, setChartData] = useState<SalesChartData>({ labels: [], datasets: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData(mode)
  }, [mode])

  const loadData = async (selectedMode: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSalesByBranch(selectedMode)
      setChartData(data)
    } catch (err) {
      console.error('Error loading sales data:', err)
      setError('Failed to load sales data')
    } finally {
      setLoading(false)
    }
  }

  const handleModeChange = (newMode: string) => {
    setMode(newMode)
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
        <h3 className="text-lg font-semibold text-slate-700">Sales by Branch</h3>
        <select
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="D">Day</option>
          <option value="W">Week</option>
          <option value="M">Month</option>
          <option value="Y">Year</option>
        </select>
      </div>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-red-500">
          {error}
        </div>
      ) : chartData.datasets.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          No data available
        </div>
      ) : (
        <Line options={options} data={chartData} />
      )}
    </div>
  )
}
