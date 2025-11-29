
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  LogOut, 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Menu,
  X,
  Settings,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  Loader2,
  Info,
  Users,
  Banknote,
  Crown,
  Monitor,
  Download,
  RotateCcw,
  Palette,
  Layout,
  FileSpreadsheet,
  ShieldAlert,
  Lock,
  KeyRound,
  UserPlus,
  ArrowLeft,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { MOCK_USERS, ACCOMMODATIONS, INITIAL_BOOKINGS } from './services/mockData';
import { User, Booking, UserRole, BookingStatus, Accommodation } from './types';
import { BookingModal } from './components/BookingModal';
import { AccommodationModal } from './components/AccommodationModal';
import { ConnectionModal } from './components/ConnectionModal';
import { sheetApi } from './services/sheetApi';

// Default URL from user
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznSyj2wv91o6HtRtU9DIKaEG69NbhdlQ_3iRs-7-NFxdM6lpnRLXkdV7EeRzUjq2x1Dw/exec';

// --- THEME CONFIGURATION ---
const THEME_CONFIG = {
  green: {
    name: 'Green Forest',
    sidebar: 'bg-park-900',
    sidebarHover: 'hover:bg-park-800',
    sidebarActive: 'bg-park-800',
    primaryBtn: 'bg-park-600 hover:bg-park-700',
    textPrimary: 'text-park-900',
    textSecondary: 'text-park-600',
    bgHighlight: 'bg-park-50',
    borderHighlight: 'border-park-200',
    ring: 'focus:ring-park-500',
  },
  blue: {
    name: 'Blue Ocean',
    sidebar: 'bg-blue-900',
    sidebarHover: 'hover:bg-blue-800',
    sidebarActive: 'bg-blue-800',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700',
    textPrimary: 'text-blue-900',
    textSecondary: 'text-blue-600',
    bgHighlight: 'bg-blue-50',
    borderHighlight: 'border-blue-200',
    ring: 'focus:ring-blue-500',
  },
  indigo: {
    name: 'Indigo Night',
    sidebar: 'bg-indigo-900',
    sidebarHover: 'hover:bg-indigo-800',
    sidebarActive: 'bg-indigo-800',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700',
    textPrimary: 'text-indigo-900',
    textSecondary: 'text-indigo-600',
    bgHighlight: 'bg-indigo-50',
    borderHighlight: 'border-indigo-200',
    ring: 'focus:ring-indigo-500',
  },
  slate: {
    name: 'Slate Professional',
    sidebar: 'bg-slate-900',
    sidebarHover: 'hover:bg-slate-800',
    sidebarActive: 'bg-slate-800',
    primaryBtn: 'bg-slate-600 hover:bg-slate-700',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    bgHighlight: 'bg-slate-50',
    borderHighlight: 'border-slate-200',
    ring: 'focus:ring-slate-500',
  }
};

type ThemeKey = keyof typeof THEME_CONFIG;

interface AppConfig {
  appName: string;
  logoUrl: string;
  theme: ThemeKey;
}

// --- Helper Functions for Data Normalization ---

// Helper for fuzzy value finding
const getValueFromRaw = (raw: any, keys: string[]) => {
  if (!raw) return null;
  // 1. Try exact match
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== '') return raw[key];
  }
  
  // 2. Try trimmed and case-insensitive match
  const rawKeys = Object.keys(raw);
  for (const key of keys) {
    const target = key.toLowerCase();
    const foundKey = rawKeys.find(k => k.trim().toLowerCase() === target || k.trim().toLowerCase().includes(target));
    if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== '') return raw[foundKey];
  }
  return null;
};

// Normalize Accommodation Data from Sheet
const normalizeAccommodation = (raw: any, index: number): Accommodation => {
  // ID
  const rawId = getValueFromRaw(raw, ['id', 'ID', 'รหัส', 'ลำดับ']);
  const id = rawId ? String(rawId) : `gen_id_${index}`;

  // Name
  const name = String(getValueFromRaw(raw, ['name', 'Name', 'ชื่อ', 'ชื่อบ้านพัก', 'รายการ', 'บ้านพัก']) || 'ไม่ระบุชื่อ');

  // Zone
  const zone = String(getValueFromRaw(raw, ['zone', 'Zone', 'โซน', 'บริเวณ', 'หมวดหมู่', 'หมวด', 'สถานที่']) || '-');

  // Description
  const description = String(getValueFromRaw(raw, ['description', 'detail', 'details', 'รายละเอียด', 'รายละเอียดบ้านพัก', 'ข้อมูลเพิ่มเติม', 'หมายเหตุ']) || '');

  // Capacity
  const capacity = Number(getValueFromRaw(raw, ['capacity', 'Capacity', 'จำนวนคน', 'รองรับ', 'ผู้เข้าพัก', 'พักได้', 'people', 'ความจุ']) || 2);

  // Price
  const price = Number(getValueFromRaw(raw, ['price', 'Price', 'ราคา', 'ราคาต่อคืน', 'ค่าที่พัก', 'cost', 'rate']) || 0);

  // Status
  const rawStatus = String(getValueFromRaw(raw, ['status', 'Status', 'สถานะ']) || 'active').toLowerCase();
  const status: 'active' | 'maintenance' = 
    (rawStatus.includes('ปิด') || rawStatus.includes('ซ่อม') || rawStatus.includes('maintenance')) 
      ? 'maintenance' 
      : 'active';

  return { id, name, zone, capacity, price, status, description };
};

// Helper for Robust Date Parsing (Thai/Eng, BE/AD)
const parseFlexibleDate = (val: any): string => {
  if (!val) return '';
  
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  if (!str) return '';

  if (str.includes('T') && str.includes('Z')) {
     try {
       const d = new Date(str);
       const y = d.getFullYear();
       const m = String(d.getMonth() + 1).padStart(2, '0');
       const da = String(d.getDate()).padStart(2, '0');
       return `${y}-${m}-${da}`;
     } catch (e) { /* ignore */ }
  }

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);

      if (month > 12 && day <= 12) {
         const temp = day;
         day = month;
         month = temp;
      }

      if (year > 2400) {
        year -= 543;
      }

      const yStr = year.toString();
      const mStr = String(month).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    }
  }

  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
         return str; 
      }
    }
  }

  return '';
}

const normalizeBooking = (raw: any, index: number): Booking => {
  const rawId = getValueFromRaw(raw, ['id', 'bookingId', 'รหัสจอง']);
  const id = rawId ? String(rawId) : `gen_bk_${index}`;

  const accId = String(getValueFromRaw(raw, ['accommodationId', 'houseId', 'รหัสบ้าน', 'บ้านพัก']) || '');

  const guestName = String(getValueFromRaw(raw, ['guestName', 'name', 'ชื่อ', 'ชื่อผู้จอง', 'ลูกค้า']) || 'ไม่ระบุ');
  const guestPhone = String(getValueFromRaw(raw, ['guestPhone', 'phone', 'เบอร์', 'โทร', 'ติดต่อ']) || '');
  const bookedBy = String(getValueFromRaw(raw, ['bookedBy', 'user', 'ผู้ทำรายการ']) || 'unknown');
  const notes = String(getValueFromRaw(raw, ['notes', 'หมายเหตุ']) || '');

  const rawCheckIn = getValueFromRaw(raw, ['checkInDate', 'checkIn', 'เข้าพัก', 'วันที่เข้า', 'วันเช็คอิน']);
  const checkInDate = parseFlexibleDate(rawCheckIn) || new Date().toISOString().split('T')[0];

  const rawCheckOut = getValueFromRaw(raw, ['checkOutDate', 'checkOut', 'ออก', 'วันที่ออก', 'วันเช็คเอาท์', 'คืนห้อง']);
  const checkOutDate = parseFlexibleDate(rawCheckOut) || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const rawCreated = getValueFromRaw(raw, ['createdAt', 'created', 'วันที่ทำรายการ']);
  const createdAt = parseFlexibleDate(rawCreated) || new Date().toISOString();

  const rawStatus = String(getValueFromRaw(raw, ['status', 'สถานะ']) || 'confirmed').toLowerCase();
  let status = BookingStatus.CONFIRMED;
  if (rawStatus.includes('pending') || rawStatus.includes('รอ') || rawStatus.includes('อนุมัติ')) status = BookingStatus.PENDING;
  if (rawStatus.includes('cancel') || rawStatus.includes('ยกเลิก')) status = BookingStatus.CANCELLED;

  return { id, accommodationId: accId, guestName, guestPhone, checkInDate, checkOutDate, status, bookedBy, createdAt, notes };
};

const normalizeUser = (raw: any, index: number): User => {
  const rawId = getValueFromRaw(raw, ['id', 'userId']);
  const id = rawId ? String(rawId) : `gen_user_${index}`;
  const username = String(getValueFromRaw(raw, ['username', 'user', 'ชื่อผู้ใช้']) || '');
  const password = String(getValueFromRaw(raw, ['password', 'pass', 'รหัสผ่าน']) || '');
  const name = String(getValueFromRaw(raw, ['name', 'fullname', 'ชื่อสกุล', 'ชื่อ']) || username);
  
  const rawRole = String(getValueFromRaw(raw, ['role', 'position', 'ตำแหน่ง', 'สิทธิ์']) || 'USER').toUpperCase();
  const role = rawRole.includes('ADMIN') ? UserRole.ADMIN : UserRole.USER;
  
  // STRICT STATUS CHECK: Default to pending unless explicitly approved or active
  const rawStatus = String(getValueFromRaw(raw, ['status', 'สถานะ']) || '').toLowerCase();

  // FAILSAFE: Ensure 'admin' is ALWAYS approved to prevent lockout
  let status: 'approved' | 'pending' = 'pending';
  if (username.toLowerCase() === 'admin') {
      status = 'approved';
  } else {
      status = (rawStatus.includes('approved') || rawStatus.includes('active')) ? 'approved' : 'pending';
  }
  
  const avatar = String(getValueFromRaw(raw, ['avatar', 'img', 'รูป']) || `https://ui-avatars.com/api/?name=${name}&background=random`);

  return { id, username, password, name, role, avatar, status };
};

// --- Login Component ---
const LoginScreen = ({ onLogin, config, users, onRefreshData }: { 
  onLogin: (u: User) => void, 
  config: AppConfig, 
  users: User[],
  onRefreshData: () => Promise<User[]> 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  
  const [showConnection, setShowConnection] = useState(false);
  const theme = THEME_CONFIG[config.theme];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setError('');

    // 1. Fetch fresh users data FIRST to ensure approval status is up to date
    let currentUsers = users;
    try {
      // Always fetch fresh data on login attempt
      currentUsers = await onRefreshData();
    } catch (err) {
      console.warn('Failed to refresh data, using cached users', err);
    }
    
    // 2. Find matching users
    const matchedUsers = currentUsers.filter(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    setIsLoginLoading(false);

    if (matchedUsers.length > 0) {
       // Prioritize 'approved' users if multiple exist (e.g. duplicates in sheet)
       const activeUser = matchedUsers.find(u => u.status === 'approved') || matchedUsers[0];

       if (activeUser.status === 'pending') {
         setError('บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ');
       } else {
         onLogin(activeUser);
       }
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    
    // Check duplicate locally
    if (users.find(u => u.username.toLowerCase() === regUsername.toLowerCase())) {
       setError('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
       setRegLoading(false);
       return;
    }

    const newUser: User = {
       id: `u${Date.now()}`,
       username: regUsername,
       password: regPassword,
       name: regName,
       role: UserRole.USER, // Default to User
       status: 'pending'    // Default to Pending
    };

    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    if (url) {
       const res = await sheetApi.registerUser(url, newUser);
       if (res.error) {
         setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล');
       } else {
         setRegSuccess(true);
         setRegName('');
         setRegUsername('');
         setRegPassword('');
       }
    } else {
       // Mock register
       alert('ไม่สามารถลงทะเบียนได้เนื่องจากยังไม่ได้เชื่อมต่อฐานข้อมูล');
    }
    setRegLoading(false);
  };

  const handleSaveUrl = (url: string) => {
    localStorage.setItem('parkStay_sheetUrl', url);
    setShowConnection(false);
    alert('บันทึก URL เรียบร้อยแล้ว (กรุณารีโหลดหน้าเว็บ)');
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative" 
         style={{backgroundImage: 'url("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")'}}>
      <div className={`absolute inset-0 ${theme.sidebar} bg-opacity-80 backdrop-blur-sm`}></div>
      
      <button 
        onClick={() => setShowConnection(true)}
        className="absolute top-4 right-4 text-white/20 hover:text-white transition p-2"
        title="ตั้งค่าฐานข้อมูล"
      >
        <Database size={24} />
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-6">
          <div className={`w-20 h-20 ${theme.bgHighlight} ${theme.textSecondary} rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-gray-100`}>
             {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Home size={36} />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{config.appName}</h1>
          <p className="text-gray-500 text-sm">ระบบบริหารจัดการบ้านพักอุทยานฯ</p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse"><AlertCircle size={16}/>{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => { setUsername(e.target.value); setError(''); }} 
                className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm ${theme.ring} focus:border-current p-3 border bg-white text-gray-900`} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }} 
                className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm ${theme.ring} focus:border-current p-3 border bg-white text-gray-900`} 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoginLoading}
              className={`w-full ${theme.primaryBtn} text-white py-3 px-4 rounded-lg transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center`}
            >
              {isLoginLoading ? <Loader2 className="animate-spin" size={20}/> : 'เข้าสู่ระบบ'}
            </button>
            
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-gray-500">ยังไม่มีบัญชี?</span>
              <button type="button" onClick={() => { setMode('register'); setError(''); }} className={`${theme.textSecondary} hover:underline font-medium`}>ขอใช้งานระบบ</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
             {regSuccess ? (
                <div className="bg-green-50 p-6 rounded-xl text-center space-y-4">
                   <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                     <h3 className="text-green-800 font-bold text-lg">ส่งคำขอเรียบร้อย</h3>
                     <p className="text-green-600 text-sm">กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติสิทธิ์การใช้งาน</p>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => { setMode('login'); setRegSuccess(false); }}
                     className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                   >
                     กลับสู่หน้าล็อกอิน
                   </button>
                </div>
             ) : (
               <>
                 <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-2">
                    <button type="button" onClick={() => { setMode('login'); setError(''); }} className="p-1 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
                    ขอใช้งานระบบใหม่
                 </div>
                 {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
                 <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล (สำหรับแสดงผล)</label>
                    <input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full rounded-lg border-gray-300 p-2.5 border bg-white" required placeholder="เช่น สมชาย ใจดี" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} className="w-full rounded-lg border-gray-300 p-2.5 border bg-white" required placeholder="ภาษาอังกฤษเท่านั้น" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full rounded-lg border-gray-300 p-2.5 border bg-white" required />
                 </div>
                 <button type="submit" disabled={regLoading} className={`w-full ${theme.primaryBtn} text-white py-3 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2`}>
                    {regLoading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20}/> ส่งคำขอใช้งาน</>}
                 </button>
               </>
             )}
          </form>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          สำหรับเจ้าหน้าที่อุทยานเท่านั้น
        </div>
      </div>
      
      <ConnectionModal 
        isOpen={showConnection} 
        onClose={() => setShowConnection(false)} 
        currentUrl={localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL} 
        onSave={handleSaveUrl} 
      />
    </div>
  );
};

// --- Pending User Row Component ---
const PendingUserRow = ({ user, onApprove, onDelete }: { user: User, onApprove: (u: User, role: UserRole) => Promise<void>, onDelete: (id: string) => Promise<void> }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleApprove = async () => {
     setIsProcessing(true);
     try {
       await onApprove(user, selectedRole);
     } finally {
       if (isMounted.current) setIsProcessing(false);
     }
  };
  
  const handleDelete = async () => {
    if(confirm('คุณต้องการปฏิเสธคำขอนี้ใช่หรือไม่?')) {
       setIsProcessing(true);
       try {
         await onDelete(user.id);
       } finally {
         if (isMounted.current) setIsProcessing(false);
       }
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-lg border border-yellow-100 gap-4 animate-in fade-in slide-in-from-left-2">
       <div className="flex items-center gap-3">
          <img src={user.avatar} className="w-10 h-10 rounded-full bg-gray-100" alt="avatar" />
          <div>
             <p className="text-sm font-bold text-gray-800">{user.name}</p>
             <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            <label className="text-xs text-gray-500 pl-1">สิทธิ์:</label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="text-xs border-0 bg-transparent text-gray-700 font-semibold focus:ring-0 p-0 pr-2 cursor-pointer"
              disabled={isProcessing}
            >
              <option value={UserRole.USER}>เจ้าหน้าที่ (User)</option>
              <option value={UserRole.ADMIN}>ผู้ดูแลระบบ (Admin)</option>
            </select>
          </div>
          <button 
            onClick={handleDelete}
            disabled={isProcessing}
            className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-xs font-medium border border-red-200 disabled:opacity-50"
          >
            ปฏิเสธ
          </button>
          <button 
            onClick={handleApprove}
            disabled={isProcessing}
            className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} 
            อนุมัติ
          </button>
       </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [appConfig, setAppConfig] = useState<AppConfig>({
    appName: 'ParkManager',
    logoUrl: '',
    theme: 'green'
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('parkStay_appConfig');
    if (savedConfig) {
      setAppConfig(JSON.parse(savedConfig));
    }
  }, []);

  const saveAppConfig = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    localStorage.setItem('parkStay_appConfig', JSON.stringify(newConfig));
    
    // Also save to sheet if connected
    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    if (url) {
      sheetApi.saveSettings(url, newConfig);
    }
  };
  
  const theme = THEME_CONFIG[appConfig.theme];

  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [accommodations, setAccommodations] = useState<Accommodation[]>(ACCOMMODATIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS); // Store users from API
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'system_settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [prefillData, setPrefillData] = useState<{accommodationId?: string, checkInDate?: string} | null>(null);
  
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Accommodation | undefined>(undefined);

  const [isConnModalOpen, setIsConnModalOpen] = useState(false);

  // System Reset States
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);

  const [statsMode, setStatsMode] = useState<'month' | 'year'>('month');
  const [viewDate, setViewDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({length: days}, (_, i) => {
        const d = new Date(year, month, i + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
    });
  };

  const dates = getDaysInMonth(viewDate);
  
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };
  const todayStr = getTodayStr();

  const fetchData = async (): Promise<any> => {
    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    if (url) {
      // Don't set loading true on simple refetch to avoid flicker
      // setLoading(true); 
      setIsConnected(true);
      const data = await sheetApi.fetchData(url);
      
      if (data.accommodations && Array.isArray(data.accommodations)) {
        const validAccs = data.accommodations.map((a: any, index: number) => normalizeAccommodation(a, index));
        setAccommodations(validAccs);
      }
      
      if (data.bookings && Array.isArray(data.bookings)) {
         const validBookings = data.bookings.map((b: any, index: number) => normalizeBooking(b, index));
         setBookings(validBookings);
      }

      // Fetch users
      if (data.users && Array.isArray(data.users)) {
         const validUsers = data.users.map((u: any, index: number) => normalizeUser(u, index));
         setUsers(validUsers);
      }
      
      // Fetch Settings
      if (data.settings && Array.isArray(data.settings)) {
         const settingsMap: any = {};
         data.settings.forEach((s: any) => {
            if(s.key) settingsMap[s.key] = s.value;
         });
         
         // Only update if we have values
         if (Object.keys(settingsMap).length > 0) {
             // Parse theme from settings
             let parsedTheme: ThemeKey = 'green';
             try {
                // Handle complex object stored as string if any, or plain values
                // If stored as separate rows:
                if (settingsMap.theme && THEME_CONFIG[settingsMap.theme as ThemeKey]) {
                   parsedTheme = settingsMap.theme as ThemeKey;
                }
             } catch(e){}

             setAppConfig(prev => ({
                 ...prev,
                 appName: settingsMap.appName || prev.appName,
                 logoUrl: settingsMap.logoUrl || prev.logoUrl,
                 theme: parsedTheme
             }));
         }
      }
      return { 
        accommodations: data.accommodations, 
        bookings: data.bookings,
        users: data.users ? data.users.map((u: any, index: number) => normalizeUser(u, index)) : []
      };
    } else {
      setIsConnected(false);
      return { accommodations, bookings, users };
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
       setLoading(true);
       await fetchData();
       setLoading(false);
    };
    loadInitial();
  }, []);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  const handleSaveBooking = async (data: Omit<Booking, 'id' | 'createdAt' | 'bookedBy'>) => {
    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    let newBooking: Booking;

    if (editingBooking) {
      newBooking = { ...editingBooking, ...data };
    } else {
      newBooking = {
        ...data,
        id: `b${Date.now()}`,
        createdAt: new Date().toISOString(),
        bookedBy: currentUser!.id
      };
    }

    if (url) {
      setLoading(true);
      const res = await sheetApi.saveBooking(url, newBooking);
      setLoading(false);
      if (res.error) {
         alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + res.error);
         return;
      }
      fetchData();
    } else {
      if (editingBooking) {
        setBookings(prev => prev.map(b => b.id === editingBooking.id ? newBooking : b));
      } else {
        setBookings(prev => [...prev, newBooking]);
      }
    }
    
    setIsModalOpen(false);
    setEditingBooking(undefined);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const cancelledBooking: Booking = { ...booking, status: BookingStatus.CANCELLED };
    
    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    
    if (url) {
      setLoading(true);
      const res = await sheetApi.saveBooking(url, cancelledBooking);
      setLoading(false);
      if (res.error) {
         alert('เกิดข้อผิดพลาดในการยกเลิก: ' + res.error);
         return;
      }
      fetchData();
    } else {
      setBookings(prev => prev.map(b => b.id === bookingId ? cancelledBooking : b));
    }
    
    setIsModalOpen(false);
    setEditingBooking(undefined);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setPrefillData(null);
    setIsModalOpen(true);
  };

  const handleSaveAcc = async (data: Omit<Accommodation, 'id'>) => {
    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    let newAcc: Accommodation;
    
    if (editingAcc) {
       newAcc = { ...data, id: editingAcc.id };
    } else {
       newAcc = { ...data, id: `h${Date.now()}` };
    }

    if (url) {
      setLoading(true);
      const res = await sheetApi.saveAccommodation(url, newAcc);
      setLoading(false);
      if (res.error) {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + res.error);
        return;
      }
      fetchData();
    } else {
      if (editingAcc) {
        setAccommodations(prev => prev.map(a => a.id === editingAcc.id ? newAcc : a));
      } else {
        setAccommodations(prev => [...prev, newAcc]);
      }
    }
    setIsAccModalOpen(false);
    setEditingAcc(undefined);
  };

  const handleDeleteAcc = async (id: string) => {
    if (window.confirm('คุณต้องการลบบ้านพักนี้ใช่หรือไม่?')) {
      const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
      if (url) {
        setLoading(true);
        await sheetApi.deleteAccommodation(url, id);
        fetchData();
        setLoading(false);
      } else {
        setAccommodations(prev => prev.filter(a => a.id !== id));
        setBookings(prev => prev.filter(b => b.accommodationId !== id));
      }
    }
  };

  const handleExportData = (mode: 'all' | 'month' | 'year', exportDate: Date) => {
    let dataToExport = [...bookings];
    let filename = 'all_bookings.csv';

    if (mode === 'month') {
       const y = exportDate.getFullYear();
       const m = String(exportDate.getMonth() + 1).padStart(2, '0');
       dataToExport = bookings.filter(b => b.checkInDate.startsWith(`${y}-${m}`));
       filename = `bookings_${y}_${m}.csv`;
    } else if (mode === 'year') {
       const y = exportDate.getFullYear();
       dataToExport = bookings.filter(b => b.checkInDate.startsWith(`${y}`));
       filename = `bookings_${y}.csv`;
    }

    const headers = ['BookingID', 'HouseID', 'HouseName', 'GuestName', 'Phone', 'CheckIn', 'CheckOut', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(b => {
        const hName = accommodations.find(a => a.id === b.accommodationId)?.name || 'Unknown';
        return [
          b.id, b.accommodationId, `"${hName}"`, `"${b.guestName}"`, `"${b.guestPhone}"`, 
          b.checkInDate, b.checkOutDate, b.status, `"${b.notes}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleSystemReset = async () => {
    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    setIsResetting(true);
    setResetProgress(0);
    
    if (url) {
      const total = bookings.length;
      if (total === 0) {
        setResetProgress(100);
      } else {
        let count = 0;
        for (const b of bookings) {
          await sheetApi.deleteBooking(url, b.id);
          count++;
          setResetProgress(Math.round((count / total) * 100));
        }
      }
      await fetchData();
    } else {
      setBookings([]);
      setResetProgress(100);
    }
    
    // Slight delay to show 100%
    setTimeout(() => {
        setIsResetting(false);
        setResetProgress(0);
        alert('ล้างข้อมูลการจองทั้งหมดเรียบร้อยแล้ว');
    }, 500);
  };

  const handleApproveUser = async (user: User, targetRole: UserRole): Promise<void> => {
    const confirmMsg = `ยืนยันการอนุมัติ "${user.name}" ให้เป็น "${targetRole === UserRole.ADMIN ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}" ใช่หรือไม่?`;
    if (!confirm(confirmMsg)) return;

    // OPTIMISTIC UPDATE: Update local state immediately
    const updatedUser: User = { ...user, status: 'approved', role: targetRole };
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    if (url) {
      // Send FULL user object to ensure sheet updates correctly
      const res = await sheetApi.saveUser(url, updatedUser);
       if (res.error) {
           alert('เกิดข้อผิดพลาดในการบันทึกไปยัง Sheet: ' + res.error);
        } else {
           // Background fetch to sync truth
           fetchData();
        }
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    // OPTIMISTIC UPDATE: Remove from local state immediately
    setUsers(prev => prev.filter(u => u.id !== userId));

    const url = localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL;
    if (url) {
        const res = await sheetApi.deleteUser(url, userId);
        if (res.error) {
           alert('เกิดข้อผิดพลาดในการลบจาก Sheet: ' + res.error);
        } else {
           fetchData();
        }
    } else {
         alert('ลบผู้ใช้งานเรียบร้อยแล้ว (Mock Mode)');
    }
  };

  const handleDeleteUserTable = async (userId: string) => {
     if (confirm('คุณต้องการลบผู้ใช้งานคนนี้ออกจากระบบใช่หรือไม่?')) {
        await handleDeleteUser(userId);
        alert('ลบผู้ใช้งานเรียบร้อยแล้ว');
     }
  }

  const getBookingForCell = (accId: string, date: string): Booking | undefined => {
    return bookings.find(b => 
      b.accommodationId === accId && 
      date >= b.checkInDate && 
      date < b.checkOutDate &&
      b.status !== BookingStatus.CANCELLED
    );
  };

  const handleSaveUrl = (url: string) => {
    localStorage.setItem('parkStay_sheetUrl', url);
    setIsConnModalOpen(false);
    setLoading(true);
    fetchData().then(() => setLoading(false));
  };

  const isVipZone = (zone: string) => {
    const z = zone.toLowerCase();
    return z.includes('vip') || z.includes('รับรอง') || z.includes('พิเศษ');
  };

  const calculateStats = () => {
    let targetBookings = bookings.filter(b => b.status !== BookingStatus.CANCELLED);
    
    if (statsMode === 'month') {
        const currentYearMonth = viewDate.toISOString().slice(0, 7);
        targetBookings = targetBookings.filter(b => 
           b.checkInDate.startsWith(currentYearMonth) || 
           b.checkOutDate.startsWith(currentYearMonth) ||
           (b.checkInDate < currentYearMonth && b.checkOutDate > currentYearMonth)
        );
    } else {
        const currentYear = String(viewDate.getFullYear());
        targetBookings = targetBookings.filter(b => 
           b.checkInDate.startsWith(currentYear) || 
           b.checkOutDate.startsWith(currentYear)
        );
    }

    const confirmedCount = targetBookings.filter(b => b.status === BookingStatus.CONFIRMED).length;

    let totalRevenue = 0;
    let totalNightsOccupied = 0;

    targetBookings.forEach(b => {
      if (b.status !== BookingStatus.CONFIRMED) return;
      
      const acc = accommodations.find(a => a.id === b.accommodationId);
      if (!acc) return;

      const start = new Date(b.checkInDate);
      const end = new Date(b.checkOutDate);
      
      let current = new Date(start);
      while(current < end) {
         const y = current.getFullYear();
         const m = String(current.getMonth() + 1).padStart(2, '0');
         const d_txt = String(current.getDate()).padStart(2, '0');
         const dateStr = `${y}-${m}-${d_txt}`;

         let inPeriod = false;
         if (statsMode === 'month') {
            const currentYearMonth = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
            if (dateStr.startsWith(currentYearMonth)) inPeriod = true;
         } else {
            const currentYear = String(viewDate.getFullYear());
            if (dateStr.startsWith(currentYear)) inPeriod = true;
         }

         if (inPeriod) {
            totalRevenue += acc.price;
            totalNightsOccupied++;
         }
         current.setDate(current.getDate() + 1);
      }
    });

    const daysInPeriod = statsMode === 'month' 
        ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() 
        : (viewDate.getFullYear() % 4 === 0 ? 366 : 365);
    
    const activeHouses = accommodations.filter(a => a.status === 'active').length;
    const totalCapacityNights = activeHouses * daysInPeriod;
    const occupancyRate = totalCapacityNights > 0 ? (totalNightsOccupied / totalCapacityNights) * 100 : 0;

    return { confirmedCount, totalRevenue, occupancyRate };
  };

  const stats = calculateStats();

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} config={appConfig} users={users} onRefreshData={async () => {
       const res = await fetchData();
       return res.users || [];
    }} />;
  }

  const totalHouses = accommodations.length;
  const occupiedToday = bookings.filter(b => 
    b.checkInDate <= todayStr && 
    b.checkOutDate > todayStr && 
    b.status !== BookingStatus.CANCELLED
  ).length;
  const availableHouses = Math.max(0, accommodations.filter(a => a.status === 'active').length - occupiedToday);


  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {loading && (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
           <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
              <Loader2 className="animate-spin text-park-600" />
              <span className="text-gray-700">กำลังประมวลผล...</span>
           </div>
        </div>
      )}

      {isResetting && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
             <div className="relative w-20 h-20 mx-auto mb-4">
               <svg className="w-full h-full" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                 <circle cx="50" cy="50" r="45" fill="none" stroke="#dc2626" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * resetProgress) / 100} className="transition-all duration-300 ease-out transform -rotate-90 origin-center" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-red-600">
                 {resetProgress}%
               </div>
             </div>
             <h3 className="text-lg font-bold text-gray-800">กำลังรีเซ็ตระบบ</h3>
             <p className="text-sm text-gray-500 mt-1">กรุณาอย่าปิดหน้าต่างนี้ จนกว่าจะเสร็จสิ้น</p>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 ${theme.sidebar} text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-xl`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white/10 p-2 rounded-lg shrink-0">
               {appConfig.logoUrl ? <img src={appConfig.logoUrl} alt="logo" className="w-5 h-5 object-cover" /> : <Home className="text-white" size={20} />}
            </div>
            <span className="font-bold text-lg truncate">{appConfig.appName}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X /></button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition ${currentView === 'dashboard' ? `${theme.sidebarActive} text-white shadow-inner` : `text-white/80 ${theme.sidebarHover}`}`}
          >
            <Calendar size={20} /> แดชบอร์ด
          </button>

          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => { setCurrentView('settings'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition ${currentView === 'settings' ? `${theme.sidebarActive} text-white shadow-inner` : `text-white/80 ${theme.sidebarHover}`}`}
            >
              <Layout size={20} /> จัดการบ้านพัก
            </button>
          )}

          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => { setCurrentView('system_settings'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition ${currentView === 'system_settings' ? `${theme.sidebarActive} text-white shadow-inner` : `text-white/80 ${theme.sidebarHover}`}`}
            >
              <Monitor size={20} /> ตั้งค่าระบบ
            </button>
          )}
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">เมนูด่วน</div>
          <button onClick={() => { setIsModalOpen(true); setEditingBooking(undefined); setPrefillData(null); setSidebarOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-white/80 ${theme.sidebarHover} rounded-xl transition`}>
            <Plus size={20} /> เพิ่มการจอง
          </button>
        </nav>

        <div className="p-4 bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white/20" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-white/60">{currentUser.role === UserRole.ADMIN ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-300 hover:text-red-200 text-sm w-full transition">
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex-none flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500"><Menu /></button>
            <h2 className={`text-xl font-bold ${theme.textPrimary} hidden sm:block`}>
              {currentView === 'dashboard' ? 'ตารางบ้านพักอุทยาน' : currentView === 'settings' ? 'จัดการข้อมูลบ้านพัก' : 'ตั้งค่าระบบ'}
            </h2>
            {isConnected && (
               <button onClick={() => { setLoading(true); fetchData().then(() => setLoading(false)); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition" title="รีเฟรชข้อมูล">
                 <RefreshCw size={18} />
               </button>
            )}
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm text-gray-500 hidden sm:inline">วันนี้: {new Date().toLocaleDateString('th-TH')}</span>
             {currentView === 'dashboard' && (
               <button onClick={() => { setIsModalOpen(true); setEditingBooking(undefined); setPrefillData(null); }} className={`${theme.primaryBtn} text-white px-4 py-2 rounded-lg text-sm shadow-md flex items-center gap-2`}>
                  <Plus size={16} /> จองด่วน
               </button>
             )}
             {currentView === 'settings' && (
               <button onClick={() => { setIsAccModalOpen(true); setEditingAcc(undefined); }} className={`${theme.primaryBtn} text-white px-4 py-2 rounded-lg text-sm shadow-md flex items-center gap-2`}>
                  <Plus size={16} /> เพิ่มบ้านพัก
               </button>
             )}
          </div>
        </header>

        {currentView === 'dashboard' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 md:p-4 space-y-2">
            
            <div className="flex-none grid grid-cols-1 md:grid-cols-3 gap-3">
               <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                     <p className="text-gray-500 text-xs flex items-center gap-1">
                       ยอดจองยืนยัน ({statsMode === 'month' ? 'รายเดือน' : 'รายปี'})
                       <button onClick={() => setStatsMode(prev => prev === 'month' ? 'year' : 'month')} className="bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded text-[10px] text-gray-600 ml-1 transition">
                         {statsMode === 'month' ? 'เปลี่ยนเป็นปี' : 'เปลี่ยนเป็นเดือน'}
                       </button>
                     </p>
                     <p className={`text-lg md:text-xl font-bold ${theme.textPrimary} mt-0.5`}>{stats.confirmedCount} รายการ</p>
                  </div>
                  <div className={`${theme.bgHighlight} p-2 rounded-full ${theme.textSecondary}`}><CheckCircle2 size={20} /></div>
               </div>

               <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                     <p className="text-gray-500 text-xs">รายรับโดยประมาณ</p>
                     <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5">฿{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-full text-green-600"><Banknote size={20} /></div>
               </div>

               <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                     <p className="text-gray-500 text-xs">อัตราการเข้าพัก & บ้านว่าง</p>
                     <div className="flex items-baseline gap-2 mt-0.5">
                       <p className="text-lg md:text-xl font-bold text-orange-600">{Math.round(stats.occupancyRate)}%</p>
                       <span className="text-xs text-gray-400">|</span>
                       <p className="text-sm font-semibold text-gray-600">{availableHouses}/{totalHouses} ว่าง</p>
                     </div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-full text-orange-600"><Users size={20} /></div>
               </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-0">
              <div className="flex-none p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2 z-20">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                   <Calendar size={16} /> ตารางจอง
                </h3>
                <div className="flex items-center gap-2">
                   <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-200 rounded-full transition text-gray-600">
                     <ChevronLeft size={18} />
                   </button>
                   <span className={`font-bold text-base ${theme.textPrimary} min-w-[140px] text-center`}>
                      {viewDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                   </span>
                   <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-200 rounded-full transition text-gray-600">
                     <ChevronRight size={18} />
                   </button>
                   <button onClick={goToToday} className={`ml-2 px-2 py-1 text-xs border ${theme.borderHighlight} ${theme.textSecondary} rounded-md hover:${theme.bgHighlight}`}>
                      วันนี้
                   </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto relative w-full scroll-smooth">
                <table className="w-full text-sm text-left border-collapse min-w-max">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-40 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 border-b sticky left-0 top-0 bg-gray-50 z-50 w-32 min-w-[120px] shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.1)] h-[48px]">วันที่ / บ้าน</th>
                      {accommodations.map(acc => {
                        const isVip = isVipZone(acc.zone);
                        return (
                          <th key={acc.id} className={`px-4 py-3 border-b min-w-[140px] text-center group relative shadow-[0_2px_5px_-2px_rgba(0,0,0,0.1)] h-[48px] ${isVip ? 'bg-orange-50 border-orange-100' : 'bg-gray-50'}`}>
                            <div className={`font-bold ${acc.status === 'maintenance' ? 'text-gray-400' : isVip ? 'text-orange-800' : theme.textPrimary} flex items-center justify-center gap-1 cursor-help`}>
                              {acc.name} 
                              {isVip ? <Crown size={14} className="text-orange-500 fill-orange-200" /> : <Info size={12} className="text-gray-400 opacity-50" />}
                            </div>
                            <div className={`text-[10px] ${isVip ? 'text-orange-600/70' : 'text-gray-500'}`}>{acc.zone} ({acc.capacity} คน)</div>
                            
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded-lg p-3 hidden group-hover:block z-50 text-left normal-case">
                              <h4 className="font-bold text-gray-800 mb-1">{acc.name}</h4>
                              <div className="text-xs text-gray-600 space-y-1">
                                  <p className="flex items-center gap-2"><span className={`w-4 h-4 ${theme.bgHighlight} rounded-full flex items-center justify-center ${theme.textSecondary}`}><Users size={10} /></span> รองรับ {acc.capacity} ท่าน</p>
                                  <p className="flex items-center gap-2"><span className={`w-4 h-4 ${theme.bgHighlight} rounded-full flex items-center justify-center ${theme.textSecondary}`}><Banknote size={10} /></span> {acc.price.toLocaleString()} บาท/คืน</p>
                                  <p className="flex items-start gap-2">
                                    <span className={`w-4 h-4 ${theme.bgHighlight} rounded-full flex items-center justify-center ${theme.textSecondary} mt-0.5`}><Info size={10} /></span> 
                                    <span className="line-clamp-3">{acc.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</span>
                                  </p>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {dates.map((date) => {
                       const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
                       const isToday = date === todayStr;
                       
                       return (
                        <tr key={date} className={`hover:bg-gray-50 ${isToday ? 'bg-blue-50/50' : ''}`}>
                          <td className={`px-4 py-2 border-b font-medium sticky left-0 z-30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${isToday ? 'bg-blue-50 text-blue-800' : isWeekend ? 'bg-red-50 text-red-800' : 'bg-white text-gray-900'}`}>
                            {new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', weekday: 'short' })}
                          </td>
                          {accommodations.map(acc => {
                            const booking = getBookingForCell(acc.id, date);
                            const isStart = booking?.checkInDate === date;
                            const isVip = isVipZone(acc.zone);
                            
                            let cellClass = "border-b border-r text-center p-0.5 relative h-12";
                            let content = null;

                            if (acc.status === 'maintenance') {
                               cellClass += " bg-gray-100";
                               content = <span className="text-[10px] text-gray-400">ปิดปรับปรุง</span>;
                            } else if (booking) {
                               const isConfirmed = booking.status === BookingStatus.CONFIRMED;
                               cellClass += isConfirmed ? " bg-green-100 hover:bg-green-200 cursor-pointer" : " bg-yellow-50 hover:bg-yellow-100 cursor-pointer";
                               
                               if (isStart || date === dates[0]) {
                                 content = (
                                   <div onClick={() => handleEdit(booking)} className="text-xs font-semibold leading-tight truncate px-1">
                                     {booking.guestName}
                                     <div className="text-[10px] font-normal opacity-75">{isConfirmed ? 'ยืนยัน' : 'รออนุมัติ'}</div>
                                   </div>
                                 );
                               }
                            } else {
                               cellClass += isVip 
                                 ? " bg-orange-50/10 hover:bg-orange-100 cursor-pointer text-transparent hover:text-orange-400" 
                                 : " hover:bg-park-50 cursor-pointer text-transparent hover:text-park-300";
                               
                               content = <div onClick={() => {
                                 setEditingBooking(undefined);
                                 setPrefillData({ accommodationId: acc.id, checkInDate: date });
                                 setIsModalOpen(true);
                               }} className="w-full h-full flex items-center justify-center text-xl">+</div>;
                            }

                            return (
                              <td key={`${date}-${acc.id}`} className={cellClass}>
                                {content}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex-none bg-white rounded-xl shadow-sm border border-gray-200 p-3 max-h-[140px] overflow-auto">
               <h3 className="font-semibold text-gray-800 mb-2 text-sm sticky top-0 bg-white pb-2 z-10">รายการจองล่าสุด</h3>
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-gray-100">
                      {bookings.slice().reverse().slice(0, 5).map(booking => {
                        const house = accommodations.find(a => a.id === booking.accommodationId);
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">
                              {booking.guestName}
                              <span className="text-xs text-gray-500 ml-2">{booking.guestPhone}</span>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">{house?.name || <span className="text-red-400">N/A</span>}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">
                              {new Date(booking.checkInDate).toLocaleDateString('th-TH')} - {new Date(booking.checkOutDate).toLocaleDateString('th-TH')}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                                booking.status === BookingStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                               <button onClick={() => handleEdit(booking)} className={`${theme.textSecondary} hover:${theme.textPrimary} text-xs font-medium`}>แก้ไข</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
            </div>

          </div>
        ) : currentView === 'settings' ? (
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-gray-800 text-lg">รายการบ้านพักทั้งหมด</h3>
                  <button 
                    onClick={() => { setIsAccModalOpen(true); setEditingAcc(undefined); }}
                    className={`${theme.primaryBtn} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2`}
                  >
                     <Plus size={16} /> เพิ่มบ้านพัก
                  </button>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg w-1/4">ชื่อบ้านพัก</th>
                        <th className="px-4 py-3">รายละเอียด</th>
                        <th className="px-4 py-3 w-20">โซน</th>
                        <th className="px-4 py-3 w-20 text-center">คน</th>
                        <th className="px-4 py-3 w-24 text-right">ราคา</th>
                        <th className="px-4 py-3 w-24 text-center">สถานะ</th>
                        <th className="px-4 py-3 rounded-r-lg text-right w-24">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {accommodations.map(acc => (
                        <tr key={acc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {acc.name}
                            <div className="text-xs text-gray-400 font-normal md:hidden">{acc.zone} | {acc.price} บ.</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-600 line-clamp-1" title={acc.description}>
                              {acc.description || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{acc.zone}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{acc.capacity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{acc.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {acc.status === 'active' ? 'ปกติ' : 'ซ่อม'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right flex justify-end gap-2">
                             <button 
                                onClick={() => { setEditingAcc(acc); setIsAccModalOpen(true); }} 
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="แก้ไข"
                             >
                                <Pencil size={16} />
                             </button>
                             <button 
                                onClick={() => handleDeleteAcc(acc.id)} 
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="ลบ"
                             >
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {accommodations.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            ยังไม่มีข้อมูลบ้านพัก กดปุ่ม "เพิ่มบ้านพัก" เพื่อเริ่มใช้งาน
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        ) : (currentUser.role === UserRole.ADMIN ? (
          <SystemSettingsView 
            config={appConfig} 
            onSaveConfig={saveAppConfig} 
            themeConfig={THEME_CONFIG}
            onExport={handleExportData}
            onReset={handleSystemReset}
            theme={theme}
            users={users}
            onApproveUser={handleApproveUser}
            onDeleteUser={handleDeleteUserTable}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            คุณไม่มีสิทธิ์เข้าถึงส่วนนี้
          </div>
        ))}
      </main>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveBooking}
        onCancelBooking={handleCancelBooking}
        accommodations={accommodations}
        existingBookings={bookings}
        bookingToEdit={editingBooking}
        currentUser={currentUser!}
        initialData={prefillData}
      />

      <AccommodationModal
        isOpen={isAccModalOpen}
        onClose={() => setIsAccModalOpen(false)}
        onSave={handleSaveAcc}
        dataToEdit={editingAcc}
      />

      <ConnectionModal
         isOpen={isConnModalOpen}
         onClose={() => setIsConnModalOpen(false)}
         currentUrl={localStorage.getItem('parkStay_sheetUrl') || DEFAULT_SCRIPT_URL}
         onSave={handleSaveUrl}
      />
    </div>
  );
}

const SystemSettingsView = ({ 
  config, 
  onSaveConfig, 
  themeConfig,
  onExport,
  onReset,
  theme,
  users,
  onApproveUser,
  onDeleteUser
}: { 
  config: AppConfig, 
  onSaveConfig: (c: AppConfig) => void,
  themeConfig: typeof THEME_CONFIG,
  onExport: (mode: 'all' | 'month' | 'year', date: Date) => void,
  onReset: () => void,
  theme: any,
  users: User[],
  onApproveUser: (u: User, role: UserRole) => Promise<void>,
  onDeleteUser: (id: string) => Promise<void>
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');
  const [localConfig, setLocalConfig] = useState(config);
  const [resetStep, setResetStep] = useState<'idle' | 'confirm' | 'pin'>('idle');
  const [resetPin, setResetPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [exportMode, setExportMode] = useState<'month' | 'year'>('month');
  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 7));
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());

  const handleSave = () => {
    onSaveConfig(localConfig);
    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
  };

  const handleConfirmReset = () => {
    if (resetPin === '2518') {
      onReset();
      setResetStep('idle');
      setResetPin('');
    } else {
      setResetError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      {/* Tabs Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('general')}
            className={`pb-3 font-medium text-sm transition relative ${activeTab === 'general' ? `text-gray-900` : 'text-gray-500 hover:text-gray-700'}`}
          >
            ตั้งค่าทั่วไป
            {activeTab === 'general' && <div className={`absolute bottom-0 left-0 w-full h-0.5 ${theme.sidebar}`}></div>}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-3 font-medium text-sm transition relative ${activeTab === 'users' ? `text-gray-900` : 'text-gray-500 hover:text-gray-700'}`}
          >
            จัดการผู้ใช้งาน
            {users.some(u => u.status === 'pending') && (
               <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">!</span>
            )}
            {activeTab === 'users' && <div className={`absolute bottom-0 left-0 w-full h-0.5 ${theme.sidebar}`}></div>}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

        {activeTab === 'general' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Palette size={20} className={theme.textSecondary} /> 
                ปรับแต่งหน้าตา (Appearance)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโครงการ (App Name)</label>
                  <input 
                    type="text" 
                    value={localConfig.appName}
                    onChange={e => setLocalConfig({...localConfig, appName: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL โลโก้ (Logo URL)</label>
                  <input 
                    type="text" 
                    value={localConfig.logoUrl}
                    onChange={e => setLocalConfig({...localConfig, logoUrl: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">ธีมสี (Theme Color)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(themeConfig).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setLocalConfig({...localConfig, theme: key as ThemeKey})}
                      className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${localConfig.theme === key ? `border-${value.textSecondary.split('-')[1]}-500 bg-gray-50` : 'border-transparent hover:bg-gray-50'}`}
                    >
                      <div className={`w-full h-12 rounded-lg ${value.sidebar}`}></div>
                      <span className="text-sm font-medium text-gray-600">{value.name}</span>
                      {localConfig.theme === key && <CheckCircle2 className={`absolute top-2 right-2 ${value.textSecondary}`} size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className={`${theme.primaryBtn} text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2`}>
                  <CheckCircle2 size={18} /> บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-green-600" /> 
                    ส่งออกข้อมูล (Export Data)
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={exportMode === 'month'} onChange={() => setExportMode('month')} className="text-park-600" /> 
                        <span className="text-sm">รายเดือน</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={exportMode === 'year'} onChange={() => setExportMode('year')} className="text-park-600" /> 
                        <span className="text-sm">รายปี</span>
                      </label>
                    </div>
                    
                    {exportMode === 'month' ? (
                      <input type="month" value={exportDate} onChange={e => setExportDate(e.target.value)} className="w-full p-2 border rounded-md" />
                    ) : (
                      <select value={exportYear} onChange={e => setExportYear(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    )}

                    <button 
                      onClick={() => onExport(exportMode, new Date(exportMode === 'month' ? exportDate : `${exportYear}-01-01`))}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Download size={18} /> ดาวน์โหลด CSV
                    </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2 relative z-10">
                    <ShieldAlert size={20} /> 
                    รีเซ็ตระบบ (Factory Reset)
                </h3>
                <p className="text-sm text-gray-600 mb-4 relative z-10">
                  การดำเนินการนี้จะลบข้อมูล "การจองทั้งหมด" ออกจากระบบและ Google Sheet อย่างถาวร ไม่สามารถกู้คืนได้
                </p>
                
                {resetStep === 'idle' && (
                    <button 
                      onClick={() => setResetStep('confirm')}
                      className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition relative z-10"
                    >
                      <RotateCcw size={18} /> ล้างข้อมูลทั้งหมด
                    </button>
                )}

                {resetStep === 'confirm' && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <p className="text-xs font-bold text-red-800 mb-2">คุณแน่ใจหรือไม่? ข้อมูลจะหายไปถาวร</p>
                      <div className="flex gap-2">
                        <button onClick={() => setResetStep('pin')} className="flex-1 bg-red-600 text-white text-xs py-2 rounded hover:bg-red-700">ยืนยัน</button>
                        <button onClick={() => setResetStep('idle')} className="flex-1 bg-white text-gray-600 text-xs py-2 rounded border border-gray-300">ยกเลิก</button>
                      </div>
                  </div>
                )}

                {resetStep === 'pin' && (
                  <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-400">
                          <KeyRound size={16} />
                        </div>
                        <input 
                          type="password" 
                          placeholder="รหัสผ่านยืนยัน (PIN)" 
                          value={resetPin}
                          onChange={e => { setResetPin(e.target.value); setResetError(''); }}
                          className="w-full pl-9 pr-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm bg-white text-gray-900"
                        />
                      </div>
                      {resetError && <p className="text-xs text-red-600 font-bold">{resetError}</p>}
                      <div className="flex gap-2">
                        <button onClick={handleConfirmReset} className="flex-1 bg-red-600 text-white text-xs py-2 rounded hover:bg-red-700 font-bold">ลบเดี๋ยวนี้</button>
                        <button onClick={() => { setResetStep('idle'); setResetPin(''); }} className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 rounded hover:bg-gray-200">ยกเลิก</button>
                      </div>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users size={20} className={theme.textSecondary} /> 
              รายชื่อผู้ใช้งานระบบ (User List)
            </h3>
            
            <div className="space-y-4">
               {users.filter(u => u.status === 'pending').length > 0 && (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                       <AlertCircle size={16} /> รอการอนุมัติ (Pending Requests)
                    </h4>
                    <div className="space-y-2">
                      {users.filter(u => u.status === 'pending').map(user => (
                        <PendingUserRow 
                          key={user.id} 
                          user={user} 
                          onApprove={onApproveUser} 
                          onDelete={onDeleteUser} 
                        />
                      ))}
                    </div>
                 </div>
               )}

               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                     <tr>
                       <th className="px-4 py-3 rounded-l-lg">ผู้ใช้งาน</th>
                       <th className="px-4 py-3">Username</th>
                       <th className="px-4 py-3">สิทธิ์ (Role)</th>
                       <th className="px-4 py-3">สถานะ</th>
                       <th className="px-4 py-3 rounded-r-lg text-right">จัดการ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {users.filter(u => u.status === 'approved').map(user => (
                       <tr key={user.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-medium flex items-center gap-3">
                           <img src={user.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                           {user.name}
                         </td>
                         <td className="px-4 py-3 text-gray-600">{user.username}</td>
                         <td className="px-4 py-3">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                           }`}>
                             {user.role}
                           </span>
                         </td>
                         <td className="px-4 py-3">
                           <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                             <CheckCircle2 size={14} /> Active
                           </span>
                         </td>
                         <td className="px-4 py-3 text-right">
                           {user.username !== 'admin' && (
                             <button 
                               onClick={() => onDeleteUser(user.id)} 
                               className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                               title="ลบผู้ใช้"
                             >
                               <Trash2 size={16} />
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        </div>
        <div className="text-center text-xs text-gray-400 pt-8 pb-4">
          ParkManager Version 2.2.0 (Pro) &copy; 2025
        </div>
      </div>
    </div>
  );
};
