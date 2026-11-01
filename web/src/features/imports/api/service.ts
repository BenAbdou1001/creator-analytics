import type { ApiResponse, ImportPreviewDto, ImportResultDto } from '@/shared/contracts'
import { apiClient } from '@/shared/lib/api-client'

export const importsService = {
  preview: (form: FormData) =>
    apiClient.post<ApiResponse<ImportPreviewDto>>('/imports/preview', form).then((res) => res.data.data),
  upload: (form: FormData) => apiClient.post<ApiResponse<ImportResultDto>>('/imports', form).then((res) => res.data.data),
}
