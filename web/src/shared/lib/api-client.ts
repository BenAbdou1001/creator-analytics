import axios from 'axios'
import { env } from './env'
import { ApiError } from '../types'

export type Params = Record<string, string | number | boolean | null | undefined>

// The one axios instance. Never call axios/fetch anywhere else: configure here, use everywhere.
// Services read `res.data.data` (the backend wraps every payload in {code, msg, data}).
export const apiClient = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1`,
})

// Empty filters mean "no filter": drop them instead of sending `?content_type=`.
apiClient.interceptors.request.use((config) => {
  if (config.params) {
    config.params = Object.fromEntries(
      Object.entries(config.params as Params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    )
  }
  return config
})

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error)
  const body: unknown = error.response?.data
  const message =
    typeof body === 'object' && body !== null && 'msg' in body && typeof body.msg === 'string' ? body.msg : error.message
  return Promise.reject(new ApiError(error.response?.status ?? 0, message, body))
})
