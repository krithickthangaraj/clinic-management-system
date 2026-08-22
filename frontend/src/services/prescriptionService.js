import api from './api'

export const prescriptionService = {
  async saveFull(payload) {
    const response = await api.post('/prescriptions/full', payload);
    return response.data;
  },

  async getFull(visitId) {
    const response = await api.get(`/prescriptions/full/${visitId}`);
    return response.data;
  },

  async create(prescriptionData) {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },

  async getByVisit(visitId) {
    const response = await api.get(`/prescriptions/visit/${visitId}`);
    return response.data;
  },

  async markPrinted(prescriptionId) {
    const response = await api.post(`/prescriptions/${prescriptionId}/print`);
    return response.data;
  },
};
