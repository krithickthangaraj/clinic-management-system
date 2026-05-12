import api from './api'

export const testService = {
  async create(testData) {
    const response = await api.post('/tests/', testData)
    return response.data
  },

  async getByVisit(visitId) {
    const response = await api.get(`/tests/visit/${visitId}`)
    return response.data
  },

  async getPending() {
    const response = await api.get('/tests/pending')
    return response.data
  },

  async update(testId, updateData) {
    const response = await api.patch(`/tests/${testId}`, updateData)
    return response.data
  }
}
