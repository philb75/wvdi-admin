import { createClient } from '@/lib/supabase/client'
import type { Schedule, ScheduleFilters, CalendarEvent, Room, Instructor, StudentSchedule } from '@/types/schedule'
import type { Branch } from '@/types/register'
import type { Service } from '@/types/student'

const supabase = createClient()

export async function getSchedules(filters: ScheduleFilters, branchIds?: number[]) {
  let query = supabase
    .from('w_schedules')
    .select(`
      *,
      w_branches!w_schedules_branch_id_fkey (id, name),
      w_services!w_schedules_service_id_fkey (id, name, service_code),
      instructor:w_contacts!w_schedules_employee_id_fkey (id, first_name, last_name, nick_name),
      w_vehicles!w_schedules_vehicle_id_fkey (id, brand, model, color, plate_number),
      w_rooms!w_schedules_room_id_fkey (id, room_name)
    `, { count: 'exact' })

  // Branch filter
  if (filters.branch_id !== 'All') {
    query = query.eq('branch_id', filters.branch_id)
  } else if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  // Date filters
  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  // Instructor filter
  if (filters.instructor_id !== 'All') {
    query = query.eq('employee_id', filters.instructor_id)
  }

  // Service filter
  if (filters.service_id !== 'All') {
    query = query.eq('service_id', filters.service_id)
  }

  // Status filter
  if (filters.status !== 'All') {
    query = query.eq('status', filters.status)
  }

  // Sorting
  const sortColumn = filters.sort === 'start' ? 'start_time' : (filters.sort || 'start_time')
  const ascending = filters.sortDirection === 'asc'
  query = query.order(sortColumn, { ascending })

  // Pagination
  const from = (filters.page - 1) * filters.items
  const to = from + filters.items - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching schedules:', error)
    throw error
  }

  // Transform data
  const schedules: Schedule[] = (data || []).map((item: any) => ({
    ...item,
    branch_name: item.w_branches?.name || '',
    service_name: item.w_services?.name || '',
    service_code: item.w_services?.service_code || '',
    instructor_name: item.instructor?.nick_name ||
      [item.instructor?.first_name, item.instructor?.last_name].filter(Boolean).join(' ') || '',
    vehicle_info: item.w_vehicles
      ? `${item.w_vehicles.color || ''} ${item.w_vehicles.brand || ''} ${item.w_vehicles.model || ''} (${item.w_vehicles.plate_number || ''})`.trim()
      : '',
    room_name: item.w_rooms?.room_name || '',
  }))

  return { data: schedules, count: count || 0 }
}

export async function getSchedulesForCalendar(branchIds?: number[], dateFrom?: string, dateTo?: string): Promise<CalendarEvent[]> {
  let query = supabase
    .from('w_schedules')
    .select(`
      id,
      start_time,
      end_time,
      status,
      w_services!w_schedules_service_id_fkey (service_code),
      instructor:w_contacts!w_schedules_employee_id_fkey (nick_name)
    `)

  if (branchIds && branchIds.length > 0) {
    query = query.in('branch_id', branchIds)
  }

  if (dateFrom) {
    query = query.gte('start_time', dateFrom)
  }
  if (dateTo) {
    query = query.lte('start_time', dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching calendar schedules:', error)
    throw error
  }

  // Transform to calendar events
  const events: CalendarEvent[] = (data || []).map((item: any) => {
    const serviceCode = item.w_services?.service_code || ''
    const instructorName = item.instructor?.nick_name || ''

    // Color based on status
    const statusColors: Record<string, string> = {
      confirmed: '#10b981', // green
      pending: '#f59e0b', // amber
      cancelled: '#ef4444', // red
      completed: '#6b7280', // gray
    }

    return {
      id: String(item.id),
      title: instructorName ? `${instructorName} - ${serviceCode}` : serviceCode,
      start: item.start_time,
      end: item.end_time,
      backgroundColor: statusColors[item.status] || '#0d9488',
      borderColor: statusColors[item.status] || '#0d9488',
      extendedProps: {
        schedule_id: item.id,
        service_code: serviceCode,
        instructor_name: instructorName,
        status: item.status,
      }
    }
  })

  return events
}

export async function getScheduleById(id: number): Promise<Schedule | null> {
  const { data, error } = await supabase
    .from('w_schedules')
    .select(`
      *,
      w_branches!w_schedules_branch_id_fkey (id, name),
      w_services!w_schedules_service_id_fkey (id, name, service_code),
      instructor:w_contacts!w_schedules_employee_id_fkey (id, first_name, last_name, nick_name),
      w_vehicles!w_schedules_vehicle_id_fkey (id, brand, model, color, plate_number),
      w_rooms!w_schedules_room_id_fkey (id, room_name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching schedule:', error)
    return null
  }

  return {
    ...data,
    branch_name: data.w_branches?.name || '',
    service_name: data.w_services?.name || '',
    service_code: data.w_services?.service_code || '',
    instructor_name: data.instructor?.nick_name ||
      [data.instructor?.first_name, data.instructor?.last_name].filter(Boolean).join(' ') || '',
    vehicle_info: data.w_vehicles
      ? `${data.w_vehicles.color || ''} ${data.w_vehicles.brand || ''} ${data.w_vehicles.model || ''} (${data.w_vehicles.plate_number || ''})`.trim()
      : '',
    room_name: data.w_rooms?.room_name || '',
  }
}

export async function createSchedule(schedule: Partial<Schedule>, studentIds: number[]): Promise<Schedule> {
  const { data, error } = await supabase
    .from('w_schedules')
    .insert({
      branch_id: schedule.branch_id,
      date: schedule.date,
      student_id: studentIds[0] || schedule.student_id,
      service_id: schedule.service_id,
      start_time: schedule.start_time || schedule.start,
      end_time: schedule.end_time || schedule.end,
      employee_id: schedule.employee_id,
      vehicle_id: schedule.vehicle_id,
      room_id: schedule.room_id,
      status: schedule.status || 'confirmed',
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateSchedule(id: number, schedule: Partial<Schedule>, studentIds?: number[]): Promise<Schedule> {
  const { data, error } = await supabase
    .from('w_schedules')
    .update({
      branch_id: schedule.branch_id,
      date: schedule.date,
      student_id: studentIds?.[0] || schedule.student_id,
      service_id: schedule.service_id,
      start_time: schedule.start_time || schedule.start,
      end_time: schedule.end_time || schedule.end,
      employee_id: schedule.employee_id,
      vehicle_id: schedule.vehicle_id,
      room_id: schedule.room_id,
      status: schedule.status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteSchedule(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('w_schedules')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteSchedules(ids: number[]): Promise<boolean> {
  const { error } = await supabase
    .from('w_schedules')
    .delete()
    .in('id', ids)

  if (error) throw error
  return true
}

export async function getBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('w_branches')
    .select('*')
    .eq('status', 'A')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('w_services')
    .select('*')
    .eq('status', 'A')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getInstructors(branchId?: number): Promise<Instructor[]> {
  // Get instructors from w_contacts that are employees with instructor role
  let query = supabase
    .from('w_contacts')
    .select('id, first_name, last_name, nick_name, branch_id')
    .eq('contact_type', 'EMPLOYEE')
    .eq('contact_status', 'Active')
    .order('nick_name')

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getVehicles(branchId?: number) {
  let query = supabase
    .from('w_vehicles')
    .select('*')
    .eq('status', 'A')
    .order('brand')

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getRooms(branchId?: number): Promise<Room[]> {
  let query = supabase
    .from('w_rooms')
    .select('*')
    .eq('status', 'A')
    .order('room_name')

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getStudentsForScheduling(serviceId?: number): Promise<any[]> {
  let query = supabase
    .from('w_contacts')
    .select('id, first_name, last_name, nick_name')
    .eq('contact_type', 'STUDENT')
    .eq('contact_status', 'Active')
    .order('last_name')

  // TODO: Filter by students who have purchased the service

  const { data, error } = await query

  if (error) throw error
  return (data || []).map(s => ({
    ...s,
    name: [s.first_name, s.last_name].filter(Boolean).join(' ') || s.nick_name || 'Unknown'
  }))
}

export async function getScheduleStatuses(): Promise<string[]> {
  return ['confirmed', 'pending', 'cancelled', 'completed']
}
