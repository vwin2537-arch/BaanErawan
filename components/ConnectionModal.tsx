import React, { useState } from 'react';
import { X, Link2, Database, AlertCircle, HelpCircle } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSave: (url: string) => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSave
}) => {
  const [url, setUrl] = useState(currentUrl);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-park-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Database size={20} />
            <h2 className="text-lg font-bold">เชื่อมต่อฐานข้อมูล</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-red-200 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
            <HelpCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">คำแนะนำ</p>
              <p>ระบบใช้ Google Sheets เป็นฐานข้อมูล กรุณานำ URL ที่ได้จากการ Deploy Web App (Apps Script) มาวางที่นี่</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Web App URL</label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-park-500 focus:ring-park-500 pl-10 p-2 border bg-white text-gray-900"
                placeholder="https://script.google.com/macros/s/..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Link2 size={16} />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              * ตรวจสอบให้แน่ใจว่าตั้งค่า "Who has access" เป็น "Anyone"
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onSave(url)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-park-600 hover:bg-park-700"
          >
            บันทึกและเชื่อมต่อ
          </button>
        </div>
      </div>
    </div>
  );
};