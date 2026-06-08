import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage if present (fallback for non-cookie envs)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hh_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hh_token')
      localStorage.removeItem('hh_user')
    }
    return Promise.reject(err)
  }
)

export default api
