import React, { useState, useEffect } from 'react';
import { Accommodation } from '../types';
import { X, Save } from 'lucide-react';

interface AccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acc: Omit<Accommodation, 'id'>) => void;
  dataToEdit?: Accommodation;
}

export const AccommodationModal: React.FC<AccommodationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dataToEdit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    zone: '',
    capacity: 2,
    price: 1000,
    status: 'active' as 'active' | 'maintenance'
  });

  useEffect(() => {
    if (dataToEdit) {
      setFormData({
        name: dataToEdit.name,
        description: dataToEdit.description || '',
        zone: dataToEdit.zone,
        capacity: dataToEdit.capacity,
        price: dataToEdit.price,
        status: dataToEdit.status
      });
    } else {
      setFormData({
        name: '',
        description: '',
        zone: '',
        capacity: 2,
        price: 1000,
        status: 'active'
      });
    }
  }, [dataToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-park-800 p-4 flex justify-between items-center">
          <h2 className="text-white text-lg font-bold">
            {dataToEdit ? 'แก้ไขข้อมูลบ้านพัก' : 'เพิ่มบ้านพักใหม่'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-red-200 transition">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อบ้านพัก</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
              placeholder="เช่น บ้านชมดาว 5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">รายละเอียด / จุดเด่น</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
              placeholder="เช่น วิวภูเขา, ใกล้น้ำตก, มีเครื่องทำน้ำอุ่น"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">โซน</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                  placeholder="เช่น A, B, VIP"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                >
                  <option value="active">เปิดให้บริการ</option>
                  <option value="maintenance">ปิดปรับปรุง</option>
                </select>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">รองรับ (คน)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">ราคา (บาท)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 p-2 border bg-white text-gray-900"
                />
             </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">ยกเลิก</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 bg-park-600 text-white rounded-md hover:bg-park-700 flex items-center gap-2">
            <Save size={16} /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};