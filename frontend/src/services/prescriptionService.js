import api from './api'

export const prescriptionService = {
  async create(prescriptionData) {
    const response = await api.post('/prescriptions', prescriptionData)
    return response.data
  },

  async getByVisit(visitId) {
    const response = await api.get(`/prescriptions/visit/${visitId}`)
    return response.data
  },

  async markPrinted(prescriptionId) {
    const response = await api.post(`/prescriptions/${prescriptionId}/print`)
    return response.data
  }
}
