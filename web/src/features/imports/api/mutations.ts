import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ImportInput } from '../types'
import { toImportFormData, toImportResult } from './mappers'
import { importsService } from './service'

export function useImportFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ImportInput) => importsService.upload(toImportFormData(input)).then(toImportResult),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
