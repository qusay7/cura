export interface AuthResponse {
  token: string
  refreshToken: string
  expiresIn?: number  
  fullName: string
  email: string
  role: string
  clinicId: string | null
  clinicName: string | null
  timeFormat?: '12' | '24'
  expiresAt: string
  refreshTokenExpiresAt: string
  permissions: string[]
}

export interface Patient {
  id: string
  patientNumber: number
  fullName: string
  phone: string | null
  gender: string | null
  dateOfBirth: string | null
  createdAt: string
}

// types/index.ts

export interface Doctor {
  id: string
  fullName: string
  specialty?: string
  phone?: string
  email?: string
  notes?: string
  isActive: boolean
  clinicId: string
  clinicName?: string
  createdAt: string
  gender?: string  // ✅ أضف
  userId?: string
  departmentId?: string
  departmentName?: string
  workType?: 'appointments' | 'queue' | 'both' // ✅ أضف
}

export interface Appointment {
  id: string           // ✅ string وليس number
  patientId: string
  patientName: string
  patientNumber: number // ✅ number وليس string
  doctorId: string | null
  doctorName: string | null
  appointmentDate: string
  type: string | null
  price: number | null
  status: string
  notes: string | null
  createdAt: string
  isPaid?: boolean | null
  amountPaid?: number
  patientBalance?: number
}

export interface DashboardData {
  type: string
  totalPatients: number
  totalDoctors: number
  totalStaff: number
  totalAppointments: number
  todayAppointments: number
  upcomingAppointments: number
  subscription: {
    planName: string
    billingCycle: string
    endDate: string
    daysRemaining: number
    maxPatients: number
    maxDoctors: number
    maxUsers: number
    currentPatients: number
    currentDoctors: number
  } | null
}