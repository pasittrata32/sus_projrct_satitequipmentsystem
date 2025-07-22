
export type UserRole = 'admin' | 'teacher';
export type Language = 'en' | 'th';
export type Program = 'Thai Programme' | 'English Programme' | 'Kindergarten';
export type BookingType = 'จอง' | 'ยืม';
export type BookingStatus = 'Booked' | 'In Use' | 'Awaiting Return' | 'Returned' | 'Cancelled';

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string; // Should not be sent to client in a real app
  role: UserRole;
}

export interface Equipment {
  id: string;
  name: string;
}

export interface Booking {
  id: number;
  teacherName: string;
  program: Program;
  classroom: string;
  period: number;
  bookingDate: string; // YYYY-MM-DD
  learningUnitNumber: string;
  learningUnitName: string;
  lessonPlanName: string;
  equipment: string[];
  type: BookingType;
  status: BookingStatus;
  createdAt: string; // ISO string
}