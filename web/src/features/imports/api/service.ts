import type { ApiResponse, ImportResultDto } from '@/shared/contracts'
import { apiClient } from '@/shared/lib/api-client'

export const importsService = {
  upload: (form: FormData) => apiClient.post<ApiResponse<ImportResultDto>>('/imports', form).then((res) => res.data.data),
}
