import React, { useState, useEffect } from 'react';
import { Accommodation, Booking, BookingStatus, User, UserRole } from '../types';
import { X, Save, Trash2, ShieldAlert, Lock, KeyRound, CalendarX } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'id' | 'createdAt' | 'bookedBy'>) => void;
  onCancelBooking?: (bookingId: string) => void;
  accommodations: Accommodation[];
  existingBookings: Booking[];
  bookingToEdit?: Booking;
  currentUser: User;
  initialData?: { accommodationId?: string, checkInDate?: string } | null;
}

// Helper for Local Date String (YYYY-MM-DD)
const getLocalTodayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

const getNextDayStr = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    // Add 1 day safely
    d.setDate(d.getDate() + 1);
    
    // Check if result is invalid, fallback
    if (isNaN(d.getTime())) return dateStr;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  } catch (e) {
    return dateStr;
  }
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onCancelBooking,
  accommodations,
  existingBookings,
  bookingToEdit,
  currentUser,
  initialData
}) => {
  const [formData, setFormData] = useState({
    accommodationId: '',
    guestName: '',
    guestPhone: '',
    checkInDate: getLocalTodayStr(),
    checkOutDate: getNextDayStr(getLocalTodayStr()),
    status: BookingStatus.CONFIRMED as BookingStatus,
    notes: ''
  });

  // Save PIN verification state
  const [isVerifyingSave, setIsVerifyingSave] = useState(false);
  const [savePin, setSavePin] = useState('');
  const [savePinError, setSavePinError] = useState('');

  // Cancellation flow state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelPin, setCancelPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Conflict State
  const [conflictBooking, setConflictBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (bookingToEdit) {
      setFormData({
        accommodationId: bookingToEdit.accommodationId,
        guestName: bookingToEdit.guestName,
        guestPhone: bookingToEdit.guestPhone,
        checkInDate: bookingToEdit.checkInDate,
        checkOutDate: bookingToEdit.checkOutDate,
        status: bookingToEdit.status,
        notes: bookingToEdit.notes || ''
      });
    } else {
      // Logic for new booking (with potential prefill)
      const defaultCheckIn = initialData?.checkInDate || getLocalTodayStr();
      const defaultCheckOut = getNextDayStr(defaultCheckIn);
      const defaultAccId = initialData?.accommodationId || accommodations[0]?.id || '';

      setFormData({
        accommodationId: defaultAccId,
        guestName: '',
        guestPhone: '',
        checkInDate: defaultCheckIn,
        checkOutDate: defaultCheckOut,
        status: BookingStatus.CONFIRMED,
        notes: ''
      });
    }
    // Reset states
    setIsVerifyingSave(false);
    setSavePin('');
    setSavePinError('');
    setIsCancelling(false);
    setCancelPin('');
    setPinError('');
    setConflictBooking(null);
  }, [bookingToEdit, accommodations, isOpen, initialData]);

  // Real-time Conflict Detection
  useEffect(() => {
    if (!formData.accommodationId || !formData.checkInDate || !formData.checkOutDate) {
      setConflictBooking(null);
      return;
    }

    const start = formData.checkInDate;
    const end = formData.checkOutDate;

    // Check if End Date is before Start Date
    if (end <= start) {
       setConflictBooking(null);
       return;
    }

    const conflict = existingBookings.find(b => {
      // 1. Skip cancelled bookings
      if (b.status === BookingStatus.CANCELLED) return false;
      
      // 2. Skip self if editing
      if (bookingToEdit && b.id === bookingToEdit.id) return false;

      // 3. Must be same house
      if (b.accommodationId !== formData.accommodationId) return false;

      // 4. Overlap Logic: (StartA < EndB) and (EndA > StartB)
      return start < b.checkOutDate && end > b.checkInDate;
    });

    setConflictBooking(conflict || null);

  }, [formData.accommodationId, formData.checkInDate, formData.checkOutDate, existingBookings, bookingToEdit]);

  const handlePreSave = () => {
    // If editing existing booking, require PIN
    if (bookingToEdit) {
      setIsVerifyingSave(true);
    } else {
      // New booking - save directly
      onSave(formData);
    }
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (savePin === '2518') {
      onSave(formData);
      setIsVerifyingSave(false);
    } else {
      setSavePinError('รหัสผ่านไม่ถูกต้อง');
      setSavePin('');
    }
  };

  const handleVerifyAndCancel = () => {
    if (cancelPin === '2518') {
      if (bookingToEdit && onCancelBooking) {
        onCancelBooking(bookingToEdit.id);
        onClose();
      }
    } else {
      setPinError('รหัสผ่านไม่ถูกต้อง');
      setCancelPin('');
    }
  };

  const isFormValid = () => {
    return (
      formData.guestName.trim() !== '' &&
      formData.checkOutDate > formData.checkInDate &&
      !conflictBooking
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-park-800 p-4 flex justify-between items-center">
          <h2 className="text-white text-lg font-bold">
            {bookingToEdit ? 'แก้ไขข้อมูลการจอง' : 'เพิ่มการจองใหม่'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-200 transition">
            <X size={24} />
          </button>
        </div>

        {isVerifyingSave ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Lock size={48} className="text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800">ยืนยันการบันทึกแก้ไข</h3>
              <p className="text-gray-500 text-sm mt-1">กรุณากรอกรหัสผ่านเพื่อยืนยันการแก้ไขข้อมูล</p>
            </div>
            
            <form onSubmit={handleConfirmSave} className="w-full max-w-xs space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    value={savePin}
                    onChange={(e) => {
                      setSavePin(e.target.value);
                      setSavePinError('');
                    }}
                    className="block w-full rounded-lg border-gray-300 pl-10 p-2.5 border bg-white text-gray-900 focus:ring-park-500 focus:border-park-500 text-center tracking-widest text-lg"
                    placeholder="รหัส 4 หลัก"
                    maxLength={4}
                    autoFocus
                  />
                </div>
                {savePinError && (
                  <p className="text-red-500 text-xs text-center mt-2 font-medium animate-pulse">{savePinError}</p>
                )}
              </div>
              <div className="flex gap-3">
                 <button
                    type="button"
                    onClick={() => setIsVerifyingSave(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 font-medium transition"
                  >
                    กลับ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-park-600 text-white py-2.5 rounded-lg hover:bg-park-700 font-medium transition flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> ยืนยัน
                  </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Conflict Alert Banner */}
              {conflictBooking && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 animate-pulse">
                  <CalendarX className="text-red-600 shrink-0 mt-0.5" size={20} />
                  <div className="text-sm">
                    <h4 className="font-bold text-red-800">ไม่สามารถจองได้: วันที่ซ้อนทับ</h4>
                    <p className="text-red-600 mt-1">
                      บ้านพักนี้ถูกจองแล้วโดย: <b>{conflictBooking.guestName}</b> <br/>
                      ({new Date(conflictBooking.checkInDate).toLocaleDateString('th-TH')} - {new Date(conflictBooking.checkOutDate).toLocaleDateString('th-TH')})
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">บ้านพัก</label>
                  <select
                    value={formData.accommodationId}
                    onChange={e => setFormData({...formData, accommodationId: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                  >
                    {accommodations.map(acc => (
                      <option key={acc.id} value={acc.id} disabled={acc.status === 'maintenance'}>
                        {acc.name} ({acc.zone}) - {acc.status === 'maintenance' ? 'ปิดปรับปรุง' : 'ว่าง'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่เข้าพัก</label>
                    <input
                      type="date"
                      value={formData.checkInDate}
                      onChange={e => setFormData({...formData, checkInDate: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่ออก</label>
                    <input
                      type="date"
                      value={formData.checkOutDate}
                      onChange={e => setFormData({...formData, checkOutDate: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                    />
                  </div>
                </div>
                {formData.checkOutDate <= formData.checkInDate && (
                   <p className="text-red-500 text-xs">วันที่ออกต้องหลังจากวันที่เข้าพัก</p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อผู้เข้าพัก</label>
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={e => setFormData({...formData, guestName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={formData.guestPhone}
                    onChange={e => setFormData({...formData, guestPhone: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                  >
                    <option value={BookingStatus.CONFIRMED}>ยืนยันแล้ว (Confirmed)</option>
                    <option value={BookingStatus.PENDING}>รออนุมัติ (Pending)</option>
                    <option value={BookingStatus.CANCELLED}>ยกเลิก (Cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                    rows={2}
                  />
                </div>
                
                {/* Admin Cancellation Section */}
                {currentUser.role === UserRole.ADMIN && bookingToEdit && bookingToEdit.status !== BookingStatus.CANCELLED && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    {!isCancelling ? (
                      <button 
                        type="button"
                        onClick={() => setIsCancelling(true)}
                        className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> ต้องการยกเลิกการจองนี้?
                      </button>
                    ) : (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-in fade-in zoom-in duration-200">
                          <div className="flex items-start gap-3">
                            <div className="text-red-500 mt-1"><ShieldAlert size={20} /></div>
                            <div className="w-full">
                              <h4 className="text-sm font-bold text-red-800 mb-1">ยืนยันการยกเลิก (เฉพาะ Admin)</h4>
                              <p className="text-xs text-red-600 mb-3">กรุณากรอกรหัสความปลอดภัยเพื่อยกเลิก</p>
                              <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-red-400">
                                      <Lock size={14} />
                                    </div>
                                    <input 
                                      type="password"
                                      value={cancelPin}
                                      onChange={(e) => {
                                        setCancelPin(e.target.value);
                                        setPinError('');
                                      }}
                                      placeholder="รหัส 4 หลัก"
                                      className="block w-full rounded border-red-300 text-sm pl-8 p-1.5 focus:border-red-500 focus:ring-red-500 bg-white text-gray-900"
                                      maxLength={4}
                                    />
                                  </div>
                                  <button 
                                    onClick={handleVerifyAndCancel}
                                    className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 font-medium"
                                  >
                                    ยืนยัน
                                  </button>
                                  <button 
                                    onClick={() => { setIsCancelling(false); setCancelPin(''); }}
                                    className="bg-white text-gray-600 border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50"
                                  >
                                    ยกเลิก
                                  </button>
                              </div>
                              {pinError && <p className="text-xs text-red-600 mt-1 font-bold">{pinError}</p>}
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ปิด
              </button>
              <button
                onClick={handlePreSave}
                disabled={!isFormValid()}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center gap-2 ${
                  isFormValid() ? 'bg-park-600 hover:bg-park-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                {conflictBooking ? 'ไม่ว่าง' : 'บันทึก'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};