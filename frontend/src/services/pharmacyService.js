import api from './api';

export const pharmacyService = {
  async getQueue() {
    const response = await api.get('/pharmacy/queue');
    return response.data;
  },

  async getInventory(params = {}) {
    const response = await api.get('/pharmacy/inventory', { params });
    return response.data;
  },

  async getPrescription(visitId) {
    const response = await api.get(`/pharmacy/prescription/${visitId}`);
    return response.data;
  },

  async dispense(visitId, payload = { payment_mode: 'Cash' }) {
    const response = await api.post(`/pharmacy/dispense/${visitId}`, payload);
    return response.data;
  },

  async createInventoryItem(data) {
    const response = await api.post('/pharmacy/inventory', data);
    return response.data;
  },

  async updateInventoryItem(id, data) {
    const response = await api.patch(`/pharmacy/inventory/${id}`, data);
    return response.data;
  },

  async receiveStock(id, payload) {
    const response = await api.post(`/pharmacy/inventory/${id}/receive-stock`, payload);
    return response.data;
  },

  async adjustStock(id, payload) {
    const response = await api.post(`/pharmacy/inventory/${id}/adjust-stock`, payload);
    return response.data;
  },

  async deleteInventoryItem(id) {
    await api.delete(`/pharmacy/inventory/${id}`);
  },

  async getItemHistory(id) {
    const response = await api.get(`/pharmacy/inventory/${id}/history`);
    return response.data;
  },
};

export default pharmacyService;
