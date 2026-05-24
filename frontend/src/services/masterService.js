import api from './api'

export const masterService = {
  // Complaints
  async listComplaints(search = '') {
    const params = search ? { search } : {}
    const response = await api.get('/master/complaints', { params })
    return response.data
  },

  async createComplaint(name) {
    const response = await api.post('/master/complaints', { name })
    return response.data
  },

  async updateComplaint(id, name) {
    const response = await api.patch(`/master/complaints/${id}`, { name })
    return response.data
  },

  async deleteComplaint(id) {
    await api.delete(`/master/complaints/${id}`)
  },

  // Diagnosis
  async listDiagnosis(search = '') {
    const response = await api.get('/master/diagnosis', { params: { search } })
    return response.data
  },

  async createDiagnosis(name) {
    const response = await api.post('/master/diagnosis', { name })
    return response.data
  },

  async updateDiagnosis(id, name) {
    const response = await api.patch(`/master/diagnosis/${id}`, { name })
    return response.data
  },

  async deleteDiagnosis(id) {
    await api.delete(`/master/diagnosis/${id}`)
  },

  // Advice
  async listAdvice(search = '') {
    const params = search ? { search } : {}
    const response = await api.get('/master/advice', { params })
    return response.data
  },

  async createAdvice(name) {
    const response = await api.post('/master/advice', { name })
    return response.data
  },

  async updateAdvice(id, name) {
    const response = await api.patch(`/master/advice/${id}`, { name })
    return response.data
  },

  async deleteAdvice(id) {
    await api.delete(`/master/advice/${id}`)
  },

  // Lab Tests
  async listLabTests(search = '', testType = null) {
    const params = {}
    if (search) params.search = search
    if (testType) params.test_type = testType
    const response = await api.get('/master/lab-tests', { params })
    return response.data
  },

  async createLabTest(name, testType) {
    const response = await api.post('/master/lab-tests', { name, test_type: testType })
    return response.data
  },

  async updateLabTest(id, name, testType = 'Lab') {
    const response = await api.patch(`/master/lab-tests/${id}`, { name, test_type: testType })
    return response.data
  },

  async deleteLabTest(id) {
    await api.delete(`/master/lab-tests/${id}`)
  }
}
