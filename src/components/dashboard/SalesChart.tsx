'use client'

import { useState } from 'react'
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
import { format, subDays } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Branch {
  id: number
  name: string
  branch_color: string
}

interface SalesChartProps {
  branches?: Branch[]
}

// Generate mock data for demonstration
const generateMockData = (mode: string) => {
  const labels: string[] = []
  const datasets: any[] = []

  const branches = [
    { name: 'Bacolod', color: '#10b981' },
    { name: 'Kabankalan', color: '#f59e0b' },
    { name: 'Dumaguete', color: '#3b82f6' },
  ]

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

  // Generate random sales data for each branch
  branches.forEach(branch => {
    const data = []
    for (let i = 0; i < numPoints; i++) {
      data.push(Math.floor(Math.random() * 50000) + 10000)
    }
    datasets.push({
      label: `${branch.name} Sales`,
      data,
      borderColor: branch.color,
      backgroundColor: branch.color,
      tension: 0.3,
    })
  })

  return { labels, datasets }
}

export default function SalesChart({ branches }: SalesChartProps) {
  const [mode, setMode] = useState('D')
  const [chartData, setChartData] = useState(() => generateMockData('D'))

  const handleModeChange = (newMode: string) => {
    setMode(newMode)
    setChartData(generateMockData(newMode))
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
        <h3 className="text-lg font-semibold text-slate-700">Sales</h3>
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
      <Line options={options} data={chartData} />
    </div>
  )
}
