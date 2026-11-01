import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tablesService } from '@/shared/lib/tables'
import type { Row } from '@/shared/types'
import type { RowDraft } from '../types'

export function useSaveRow(table: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (draft: RowDraft) => {
      const body = JSON.parse(draft.text) as Row
      return draft.key ? tablesService.update(table, draft.key, body) : tablesService.create(table, body)
    },
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useDeleteRow(table: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: Row) => tablesService.remove(table, key),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
