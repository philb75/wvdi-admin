'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import {
  getSchedulesForCalendar,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getBranches,
  getServices,
  getInstructors,
  getVehicles,
  getRooms,
  getStudentsForScheduling,
  getScheduleStatuses,
} from '@/lib/services/schedules'
import type { CalendarEvent, Schedule, Instructor, Room } from '@/types/schedule'
import type { Branch } from '@/types/register'
import type { Service } from '@/types/student'
import { useAuth } from '@/lib/contexts/AuthContext'

// Status colors
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-75">{label}</div>
        </div>
      </div>
    </div>
  )
}

// Schedule Modal Component
function ScheduleModal({
  isOpen,
  onClose,
  schedule,
  selectedDate,
  selectedStart,
  selectedEnd,
  onSave,
  branches,
  services,
  statuses,
}: {
  isOpen: boolean
  onClose: () => void
  schedule: Schedule | null
  selectedDate: string | null
  selectedStart: string | null
  selectedEnd: string | null
  onSave: (data: Partial<Schedule>, studentIds: number[]) => Promise<void>
  branches: Branch[]
  services: Service[]
  statuses: string[]
}) {
  const [formData, setFormData] = useState<Partial<Schedule>>({
    branch_id: null,
    service_id: null,
    date: '',
    start: '',
    end: '',
    employee_id: null,
    vehicle_id: null,
    room_id: null,
    status: 'confirmed',
  })
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [existingStudents, setExistingStudents] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        // Editing existing schedule
        setFormData({
          branch_id: schedule.branch_id,
          service_id: schedule.service_id,
          date: schedule.date || '',
          start: schedule.start || '',
          end: schedule.end || '',
          employee_id: schedule.employee_id,
          vehicle_id: schedule.vehicle_id,
          room_id: schedule.room_id,
          status: schedule.status || 'confirmed',
        })
        // Set existing student from schedule's student_id
        if (schedule.student_id) {
          setSelectedStudents([schedule.student_id])
        } else {
          setSelectedStudents([])
        }
        setExistingStudents([])
      } else {
        // Creating new schedule
        const dateStr = selectedDate || new Date().toISOString().split('T')[0]
        setFormData({
          branch_id: null,
          service_id: null,
          date: dateStr,
          start: selectedStart || '',
          end: selectedEnd || '',
          employee_id: null,
          vehicle_id: null,
          room_id: null,
          status: 'confirmed',
        })
        setSelectedStudents([])
        setExistingStudents([])
      }
      setErrors({})
    }
  }, [isOpen, schedule, selectedDate, selectedStart, selectedEnd])

  // Load dropdowns when branch changes
  useEffect(() => {
    if (formData.branch_id) {
      Promise.all([
        getInstructors(formData.branch_id),
        getVehicles(formData.branch_id),
        getRooms(formData.branch_id),
      ]).then(([inst, veh, rm]) => {
        setInstructors(inst)
        setVehicles(veh)
        setRooms(rm)
      })
    } else {
      setInstructors([])
      setVehicles([])
      setRooms([])
    }
  }, [formData.branch_id])

  // Load students when service changes
  useEffect(() => {
    if (formData.service_id) {
      getStudentsForScheduling(formData.service_id).then(setStudents)
    } else {
      setStudents([])
    }
  }, [formData.service_id])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.branch_id) newErrors.branch_id = 'Branch is required'
    if (!formData.service_id) newErrors.service_id = 'Service is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.start) newErrors.start = 'Start time is required'
    if (!formData.end) newErrors.end = 'End time is required'
    if (!formData.employee_id) newErrors.employee_id = 'Instructor is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await onSave(formData, selectedStudents)
      onClose()
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-500 to-teal-600">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {schedule ? 'Edit Schedule' : 'New Schedule'}
          </h2>
          {formData.date && (
            <p className="text-teal-100 text-sm mt-1">{new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.branch_id || ''}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? Number(e.target.value) : null, employee_id: null, vehicle_id: null, room_id: null })}
                className={`w-full rounded-lg border ${errors.branch_id ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id}</p>}
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service_id || ''}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value ? Number(e.target.value) : null })}
                className={`w-full rounded-lg border ${errors.service_id ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                <option value="">Select Service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.service_code})</option>
                ))}
              </select>
              {errors.service_id && <p className="text-red-500 text-xs mt-1">{errors.service_id}</p>}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start?.split('T')[1]?.slice(0, 5) || formData.start || ''}
                onChange={(e) => {
                  const date = formData.date || new Date().toISOString().split('T')[0]
                  setFormData({ ...formData, start: `${date}T${e.target.value}:00` })
                }}
                className={`w-full rounded-lg border ${errors.start ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.start && <p className="text-red-500 text-xs mt-1">{errors.start}</p>}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.end?.split('T')[1]?.slice(0, 5) || formData.end || ''}
                onChange={(e) => {
                  const date = formData.date || new Date().toISOString().split('T')[0]
                  setFormData({ ...formData, end: `${date}T${e.target.value}:00` })
                }}
                className={`w-full rounded-lg border ${errors.end ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.end && <p className="text-red-500 text-xs mt-1">{errors.end}</p>}
            </div>

            {/* Instructor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employee_id || ''}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value ? Number(e.target.value) : null })}
                disabled={!formData.branch_id}
                className={`w-full rounded-lg border ${errors.employee_id ? 'border-red-300' : 'border-gray-200'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50`}
              >
                <option value="">{formData.branch_id ? 'Select Instructor' : 'Select branch first'}</option>
                {instructors.map(i => (
                  <option key={i.id} value={i.id}>{i.nick_name || `${i.first_name} ${i.last_name}`}</option>
                ))}
              </select>
              {errors.employee_id && <p className="text-red-500 text-xs mt-1">{errors.employee_id}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status || 'confirmed'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Vehicle (PDC) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle (PDC)
              </label>
              <select
                value={formData.vehicle_id || ''}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value ? Number(e.target.value) : null })}
                disabled={!formData.branch_id}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
              >
                <option value="">{formData.branch_id ? 'Select Vehicle' : 'Select branch first'}</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.color} {v.brand} {v.model} ({v.plate_number})</option>
                ))}
              </select>
            </div>

            {/* Room (TDC) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room (TDC)
              </label>
              <select
                value={formData.room_id || ''}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value ? Number(e.target.value) : null })}
                disabled={!formData.branch_id}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
              >
                <option value="">{formData.branch_id ? 'Select Room' : 'Select branch first'}</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.room_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Multi-select */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Students
            </label>
            {!formData.service_id ? (
              <p className="text-gray-400 text-sm">Select a service first</p>
            ) : students.length === 0 ? (
              <p className="text-gray-400 text-sm">No students available</p>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-2">
                {students.map(student => (
                  <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{student.name}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedStudents.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{selectedStudents.length} student(s) selected</p>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Schedule View Modal
function ScheduleViewModal({
  isOpen,
  onClose,
  schedule,
  onEdit,
  onDelete,
}: {
  isOpen: boolean
  onClose: () => void
  schedule: Schedule | null
  onEdit: () => void
  onDelete: () => void
}) {
  if (!isOpen || !schedule) return null

  const statusStyle = statusColors[schedule.status || 'confirmed'] || statusColors.confirmed

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-500 to-teal-600">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Details
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              {(schedule.status || 'confirmed').charAt(0).toUpperCase() + (schedule.status || 'confirmed').slice(1)}
            </span>
            <span className="text-gray-500 text-sm">{schedule.service_code}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Service</label>
              <p className="font-medium text-gray-800">{schedule.service_name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Branch</label>
              <p className="font-medium text-gray-800">{schedule.branch_name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Date</label>
              <p className="font-medium text-gray-800">{schedule.date ? new Date(schedule.date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Time</label>
              <p className="font-medium text-gray-800">
                {schedule.start ? new Date(schedule.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                {' - '}
                {schedule.end ? new Date(schedule.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Instructor</label>
              <p className="font-medium text-gray-800">{schedule.instructor_name || '-'}</p>
            </div>
            {schedule.vehicle_info && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</label>
                <p className="font-medium text-gray-800">{schedule.vehicle_info}</p>
              </div>
            )}
            {schedule.room_name && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Room</label>
                <p className="font-medium text-gray-800">{schedule.room_name}</p>
              </div>
            )}
          </div>

          {schedule.student_id && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Student ID</label>
              <p className="font-medium text-gray-800">#{schedule.student_id}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SchedulesPage() {
  const { profile } = useAuth()
  const calendarRef = useRef<any>(null)

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [statuses, setStatuses] = useState<string[]>([])

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
  })

  const branchIds = useMemo(() => profile?.branches || [], [profile?.branches])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      // Get current month range
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0)

      const calendarEvents = await getSchedulesForCalendar(
        branchIds.length > 0 ? branchIds : undefined,
        firstDay.toISOString(),
        lastDay.toISOString()
      )

      setEvents(calendarEvents)

      // Calculate stats
      const confirmed = calendarEvents.filter(e => e.extendedProps?.status === 'confirmed').length
      const pending = calendarEvents.filter(e => e.extendedProps?.status === 'pending').length
      const completed = calendarEvents.filter(e => e.extendedProps?.status === 'completed').length

      setStats({
        total: calendarEvents.length,
        confirmed,
        pending,
        completed,
      })
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [branchIds])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    Promise.all([
      getBranches(),
      getServices(),
      getScheduleStatuses(),
    ]).then(([b, s, st]) => {
      setBranches(b)
      setServices(s)
      setStatuses(st)
    })
  }, [])

  const handleDateSelect = (selectInfo: any) => {
    if (!selectInfo.allDay) {
      setSelectedDate(selectInfo.startStr.split('T')[0])
      setSelectedStart(selectInfo.startStr)
      setSelectedEnd(selectInfo.endStr)
      setSelectedSchedule(null)
      setShowModal(true)
    }
  }

  const handleEventClick = async (clickInfo: any) => {
    const scheduleId = clickInfo.event.id
    const schedule = await getScheduleById(Number(scheduleId))
    if (schedule) {
      setSelectedSchedule(schedule)
      setShowViewModal(true)
    }
  }

  const handleSaveSchedule = async (data: Partial<Schedule>, studentIds: number[]) => {
    if (selectedSchedule) {
      await updateSchedule(selectedSchedule.id, data, studentIds)
    } else {
      await createSchedule(data, studentIds)
    }
    await loadEvents()
  }

  const handleEditSchedule = () => {
    setShowViewModal(false)
    setShowModal(true)
  }

  const handleDeleteSchedule = async () => {
    if (selectedSchedule && confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule(selectedSchedule.id)
      setShowViewModal(false)
      setSelectedSchedule(null)
      await loadEvents()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schedules</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student schedules and appointments</p>
        </div>
        <button
          onClick={() => {
            setSelectedSchedule(null)
            setSelectedDate(new Date().toISOString().split('T')[0])
            setSelectedStart(null)
            setSelectedEnd(null)
            setShowModal(true)
          }}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-teal-600 hover:to-teal-700 transition-all shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Schedules"
          value={stats.total}
          color="teal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          color="gray"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-500">Loading schedules...</p>
            </div>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm text-gray-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-sm text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-sm text-gray-600">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500" />
          <span className="text-sm text-gray-600">Completed</span>
        </div>
      </div>

      {/* Modals */}
      <ScheduleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        schedule={selectedSchedule}
        selectedDate={selectedDate}
        selectedStart={selectedStart}
        selectedEnd={selectedEnd}
        onSave={handleSaveSchedule}
        branches={branches}
        services={services}
        statuses={statuses}
      />

      <ScheduleViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        schedule={selectedSchedule}
        onEdit={handleEditSchedule}
        onDelete={handleDeleteSchedule}
      />
    </div>
  )
}
