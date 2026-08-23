import api from './api';

export const labService = {
  async getQueue() {
    const response = await api.get('/lab/queue');
    return Array.isArray(response.data) ? response.data : [];
  },

  async getOrderDetails(visitId) {
    const response = await api.get(`/lab/order/${visitId}`);
    return response.data;
  },

  async listTestMaster(params = {}) {
    const response = await api.get('/lab/tests/master', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  async createTestMaster(data) {
    const response = await api.post('/lab/tests/master', data);
    return response.data;
  },

  async updateTestMaster(id, data) {
    const response = await api.put(`/lab/tests/master/${id}`, data);
    return response.data;
  },

  async finalizeOrder(payload) {
    const response = await api.post('/lab/order/finalize', payload);
    return response.data;
  },
};

export default labService;
