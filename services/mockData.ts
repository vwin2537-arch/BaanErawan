import { Accommodation, Booking, BookingStatus, UserRole, User } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: '1234',
    name: 'หัวหน้าอุทยาน (Admin)',
    role: UserRole.ADMIN,
    avatar: 'https://picsum.photos/200/200?random=1',
    status: 'approved'
  },
  {
    id: 'u2',
    username: 'staff',
    password: '1234',
    name: 'เจ้าหน้าที่ (Staff)',
    role: UserRole.USER,
    avatar: 'https://picsum.photos/200/200?random=2',
    status: 'approved'
  }
];

export const ACCOMMODATIONS: Accommodation[] = [
  { 
    id: 'h1', 
    name: 'บ้านชมดาว 1', 
    zone: 'โซน A', 
    capacity: 4, 
    price: 1500, 
    status: 'active',
    description: 'บ้านพักเดี่ยว วิวภูเขา บรรยากาศเงียบสงบ มีระเบียงส่วนตัว'
  },
  { 
    id: 'h2', 
    name: 'บ้านชมดาว 2', 
    zone: 'โซน A', 
    capacity: 4, 
    price: 1500, 
    status: 'active',
    description: 'บ้านพักเดี่ยว ใกล้จุดชมวิวพระอาทิตย์ขึ้น'
  },
  { 
    id: 'h3', 
    name: 'บ้านชมดาว 3', 
    zone: 'โซน A', 
    capacity: 6, 
    price: 2000, 
    status: 'active',
    description: 'บ้านพักขนาดกลาง เหมาะสำหรับครอบครัว'
  },
  { 
    id: 'h4', 
    name: 'เรือนริมน้ำ 1', 
    zone: 'โซน B', 
    capacity: 2, 
    price: 1200, 
    status: 'active',
    description: 'เรือนไม้ริมลำธาร ฟังเสียงน้ำไหล สดชื่นตลอดปี'
  },
  { 
    id: 'h5', 
    name: 'เรือนริมน้ำ 2', 
    zone: 'โซน B', 
    capacity: 2, 
    price: 1200, 
    status: 'maintenance',
    description: 'เรือนไม้ริมลำธาร อยู่ระหว่างการซ่อมแซมหลังคา'
  },
  { 
    id: 'h6', 
    name: 'บ้านพักรับรองพิเศษ', 
    zone: 'VIP', 
    capacity: 10, 
    price: 5000, 
    status: 'active',
    description: 'บ้านพักขนาดใหญ่ พร้อมห้องประชุมและลานจัดกิจกรรมส่วนตัว'
  },
];

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    accommodationId: 'h1',
    guestName: 'คุณสมชาย ใจดี',
    guestPhone: '081-111-1111',
    checkInDate: formatDate(today),
    checkOutDate: formatDate(addDays(today, 2)),
    status: BookingStatus.CONFIRMED,
    bookedBy: 'u2',
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    accommodationId: 'h3',
    guestName: 'บริษัท ท่องเที่ยวไทย',
    guestPhone: '02-999-9999',
    checkInDate: formatDate(addDays(today, 1)),
    checkOutDate: formatDate(addDays(today, 3)),
    status: BookingStatus.PENDING,
    bookedBy: 'u1',
    createdAt: new Date().toISOString(),
    notes: 'รอโอนมัดจำ'
  },
  {
    id: 'b3',
    accommodationId: 'h6',
    guestName: 'คณะท่านรองฯ',
    guestPhone: '089-000-0000',
    checkInDate: formatDate(today),
    checkOutDate: formatDate(addDays(today, 1)),
    status: BookingStatus.CONFIRMED,
    bookedBy: 'u1',
    createdAt: new Date().toISOString(),
    notes: 'ด่วนพิเศษ'
  }
];