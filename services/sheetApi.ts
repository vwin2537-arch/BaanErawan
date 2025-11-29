import { Accommodation, Booking, ApiResponse, User } from '../types';

// ฟังก์ชันแปลงข้อมูลให้ปลอดภัยสำหรับการส่งไป Google Sheets
const safePayload = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

export const sheetApi = {
  async fetchData(scriptUrl: string): Promise<ApiResponse> {
    try {
      // เพิ่ม timestamp (t=...) เพื่อป้องกัน Cache
      const cacheBuster = `&t=${Date.now()}`;
      const separator = scriptUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${scriptUrl}${separator}op=read_all${cacheBuster}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Failed to fetch data' };
    }
  },

  async registerUser(scriptUrl: string, user: User): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            op: 'save_user', 
            payload: safePayload(user) 
        })
      });
      return await response.json();
    } catch (error) {
       return { error: 'Failed to register user' };
    }
  },

  async saveBooking(scriptUrl: string, booking: Booking): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({ 
            op: 'save_booking', 
            payload: safePayload(booking) 
        })
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Failed to save booking' };
    }
  },

  async deleteBooking(scriptUrl: string, id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ op: 'delete_booking', id })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to delete booking' };
    }
  },

  async saveAccommodation(scriptUrl: string, acc: Accommodation): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            op: 'save_accommodation', 
            payload: safePayload(acc) 
        })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to save accommodation' };
    }
  },

  async deleteAccommodation(scriptUrl: string, id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ op: 'delete_accommodation', id })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to delete accommodation' };
    }
  },

  async saveUser(scriptUrl: string, user: User): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            op: 'save_user', 
            payload: safePayload(user) 
        })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to save user' };
    }
  },

  async deleteUser(scriptUrl: string, id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ op: 'delete_user', id })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to delete user' };
    }
  },

  async saveSettings(scriptUrl: string, settings: any): Promise<ApiResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            op: 'save_settings', 
            payload: settings
        })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Failed to save settings' };
    }
  }
};