import api from './api'

export const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },

  async getCurrentUser(token) {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}
