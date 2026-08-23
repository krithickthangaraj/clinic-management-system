import api from './api';

export const settingsService = {
  // 1. Hospital Profile
  async getHospital() {
    const response = await api.get('/settings/hospital');
    return response.data;
  },

  async updateHospital(data) {
    const response = await api.put('/settings/hospital', data);
    return response.data;
  },

  // 2. Staff Management
  async listStaff(params = {}) {
    const response = await api.get('/settings/staff', { params });
    return response.data;
  },

  async createStaff(data) {
    const response = await api.post('/settings/staff', data);
    return response.data;
  },

  async updateStaff(userId, data) {
    const response = await api.put(`/settings/staff/${userId}`, data);
    return response.data;
  },

  async toggleStaffStatus(userId) {
    const response = await api.patch(`/settings/staff/${userId}/status`);
    return response.data;
  },

  async resetStaffPassword(userId, newPassword) {
    const response = await api.post(`/settings/staff/${userId}/reset-password`, {
      new_password: newPassword,
    });
    return response.data;
  },

  // 3. Clinical Dictionary (Master Data)
  async listDictionary(category, params = {}) {
    const response = await api.get(`/settings/dictionary/${category}`, { params });
    return response.data;
  },

  async addDictionaryTerm(category, data) {
    const response = await api.post(`/settings/dictionary/${category}`, data);
    return response.data;
  },

  async updateDictionaryTerm(category, itemId, data) {
    const response = await api.put(`/settings/dictionary/${category}/${itemId}`, data);
    return response.data;
  },

  async deleteDictionaryTerm(category, itemId) {
    const response = await api.delete(`/settings/dictionary/${category}/${itemId}`);
    return response.data;
  },

  // 4. My Profile
  async getProfile() {
    const response = await api.get('/settings/profile');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/settings/profile', data);
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/settings/profile/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
