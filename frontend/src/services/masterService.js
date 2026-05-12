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

  // Diagnosis
  async listDiagnosis(search = '') {
    const response = await api.get('/master/diagnosis', { params: { search } })
    return response.data
  },

  async createDiagnosis(name) {
    const response = await api.post('/master/diagnosis', { name })
    return response.data
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
  }
}
