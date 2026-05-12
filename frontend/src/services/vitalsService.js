import api from './api'

export const vitalsService = {
  async create(vitalsData) {
    const response = await api.post('/vitals', vitalsData)
    return response.data
  },

  async getByVisit(visitId) {
    const response = await api.get(`/vitals/visit/${visitId}`)
    return response.data
  },

  async updateByVisit(visitId, data) {
    const response = await api.patch(`/vitals/visit/${visitId}`, data)
    return response.data
  }
}
