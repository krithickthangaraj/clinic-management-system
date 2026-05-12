import api from './api'

export const templateService = {
  async list() {
    const response = await api.get('/templates/')
    return response.data
  },

  async create(templateData) {
    const response = await api.post('/templates/', templateData)
    return response.data
  },

  async delete(templateId) {
    await api.delete(`/templates/${templateId}`)
  }
}
