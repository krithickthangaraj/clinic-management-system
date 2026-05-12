import api from './api'

export const patientService = {
  async register(patientData) {
    const response = await api.post('/patients/register', patientData)
    return response.data
  },

  async search(q, limit = 20) {
    const response = await api.get('/patients/search', { params: { q: (q || '').trim(), limit } })
    return response.data
  },

  async getHistory(patientId) {
    const response = await api.get(`/patients/${patientId}/history`)
    return response.data
  },

  async list(search = '', skip = 0, limit = 100) {
    const response = await api.get('/patients/', {
      params: { search, skip, limit }
    })
    return response.data
  },

  async getById(patientId) {
    const response = await api.get(`/patients/${patientId}`)
    return response.data
  },

  async update(patientId, data) {
    const response = await api.patch(`/patients/${patientId}`, data)
    return response.data
  }
}
