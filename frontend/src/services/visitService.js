import api from './api'

export const visitService = {
  async list(statusFilter = null, skip = 0, limit = 50) {
    const response = await api.get('/visits/', {
      params: { status_filter: statusFilter, skip, limit }
    })
    return response.data
  },

  async getReceptionToday() {
    const response = await api.get('/visits/reception-today')
    return response.data
  },

  async createForPatient(patientId) {
    const response = await api.post('/visits/', { patient_id: patientId })
    return response.data
  },

  async getQueue() {
    const response = await api.get('/visits/queue')
    return response.data
  },

  async getDoctorToday() {
    const response = await api.get('/visits/doctor-today')
    return response.data
  },

  async getDoctorDashboard(consultant = null) {
    const params = consultant ? { consultant } : {}
    try {
      const response = await api.get('/doctor/dashboard', { params })
      return response.data
    } catch {
      const response = await api.get('/visits/doctor-dashboard', { params })
      return response.data
    }
  },

  async getById(visitId) {
    const response = await api.get(`/visits/${visitId}`)
    return response.data
  },

  async update(visitId, updateData) {
    const response = await api.patch(`/visits/${visitId}`, updateData)
    return response.data
  }
}
