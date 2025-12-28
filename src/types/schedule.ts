// Schedule types for WVDI

export interface Schedule {
  id: number
  branch_id: number | null
  date: string | null
  student_id: number | null
  service_id: number | null
  start: string | null
  end: string | null
  employee_id: number | null
  vehicle_id: number | null
  room_id: number | null
  status: string | null
  created_at: string
  updated_at: string

  // Joined fields
  branch_name?: string
  service_name?: string
  service_code?: string
  instructor_name?: string
  vehicle_info?: string
  room_name?: string
  student_name?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    schedule_id: number
    service_code?: string
    instructor_name?: string
    status?: string
  }
}

export interface ScheduleFilters {
  date_from: string
  date_to: string
  branch_id: number | 'All'
  instructor_id: number | 'All'
  service_id: number | 'All'
  status: string | 'All'
  search: string
  page: number
  items: number
  sort: string
  sortDirection: 'asc' | 'desc'
}

export interface StudentSchedule {
  id: number
  schedule_id: number
  student_id: number
  created_at: string
  updated_at: string

  // Joined fields
  student_name?: string
}

export interface Room {
  id: number
  branch_id: number | null
  room_name: string
  capacity: number | null
  status: string
}

export interface Instructor {
  id: number
  first_name: string | null
  last_name: string | null
  nick_name: string | null
  branch_id: number | null
}
