export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status?: 'approved' | 'pending';
}

export interface Accommodation {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  price: number;
  status: 'active' | 'maintenance';
  description?: string; // รายละเอียดบ้านพัก
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

export interface Booking {
  id: string;
  accommodationId: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  status: BookingStatus;
  bookedBy: string; // User ID
  createdAt: string;
  notes?: string;
}

export interface DayData {
  date: string;
  bookings: Record<string, Booking | null>; // Map accommodationId to Booking
}

export interface Setting {
  key: string;
  value: any;
}

export interface ApiResponse {
  accommodations?: Accommodation[];
  bookings?: Booking[];
  users?: User[];
  settings?: Setting[];
  success?: boolean;
  error?: string;
}