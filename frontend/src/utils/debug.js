// Debug utility for development
export const debugAuth = () => {
  const token = localStorage.getItem('token')
  console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'None')
  return token
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  window.location.href = '/login'
}
