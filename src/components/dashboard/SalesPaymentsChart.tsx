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

interface SalesPaymentsChartProps {
  branches?: Branch[]
}

// Generate mock data for demonstration
const generateMockData = (mode: string, branch: string) => {
  const labels: string[] = []
  const salesData: number[] = []
  const paymentsData: number[] = []

  // Generate labels based on mode
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

  // Generate random data
  for (let i = 0; i < numPoints; i++) {
    salesData.push(Math.floor(Math.random() * 80000) + 20000)
    paymentsData.push(Math.floor(Math.random() * 60000) + 15000)
  }

  return {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: `${branch === 'All' ? 'All Branches' : branch} Sales`,
        data: salesData,
        borderColor: '#14b8a6',
        backgroundColor: '#14b8a6',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: `${branch === 'All' ? 'All Branches' : branch} Payments`,
        data: paymentsData,
        backgroundColor: 'rgba(20, 184, 166, 0.4)',
        borderColor: 'rgba(20, 184, 166, 0.4)',
        yAxisID: 'y',
      },
    ],
  }
}

export default function SalesPaymentsChart({ branches }: SalesPaymentsChartProps) {
  const [mode, setMode] = useState('D')
  const [branch, setBranch] = useState('All')
  const [chartData, setChartData] = useState(() => generateMockData('D', 'All'))

  const handleChange = (newMode: string, newBranch: string) => {
    setMode(newMode)
    setBranch(newBranch)
    setChartData(generateMockData(newMode, newBranch))
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Sales vs Payments</h3>
        <div className="flex gap-2">
          <select
            value={mode}
            onChange={(e) => handleChange(e.target.value, branch)}
            className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="D">Day</option>
            <option value="W">Week</option>
            <option value="M">Month</option>
            <option value="Y">Year</option>
          </select>
          <select
            value={branch}
            onChange={(e) => handleChange(mode, e.target.value)}
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
      <Chart type="bar" options={options} data={chartData} />
    </div>
  )
}
