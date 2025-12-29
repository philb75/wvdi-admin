'use client'

import { useState, useEffect } from 'react'
import { getDashboardStats } from '@/lib/services/dashboard'

interface StatsData {
  todaySales: number
  monthSales: number
  yearSales: number
  pendingRequisitions: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 text-red-500 rounded-lg p-4 mb-6">
        {error || 'Failed to load statistics'}
      </div>
    )
  }

  const statCards = [
    {
      label: "Today's Sales",
      value: formatCurrency(stats.todaySales),
      icon: (
        <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-teal-50',
    },
    {
      label: "Month's Sales",
      value: formatCurrency(stats.monthSales),
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-blue-50',
    },
    {
      label: "Year's Sales",
      value: formatCurrency(stats.yearSales),
      icon: (
        <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Pending Requisitions',
      value: formatCurrency(stats.pendingRequisitions),
      icon: (
        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      bgColor: 'bg-amber-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <div className={`${card.bgColor} p-3 rounded-lg`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-xl font-bold text-slate-800">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
