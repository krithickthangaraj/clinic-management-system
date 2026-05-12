import api from './api'

export const patientHistoryService = {
  async get(patientId, historyType) {
    const response = await api.get(`/patient-history/${patientId}/${historyType}`)
    return response.data
  },

  async create(patientId, historyType, value) {
    const response = await api.post(`/patient-history/${patientId}/${historyType}`, { patient_id: patientId, value })
    return response.data
  },

  async toggle(historyId, historyType, isActive) {
    const response = await api.patch(`/patient-history/${historyId}/${historyType}?is_active=${isActive}`)
    return response.data
  }
}
