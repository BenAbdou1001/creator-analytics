import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tablesService } from '@/shared/lib/tables'
import type { Row, TableMeta } from '@/shared/types'
import { rowBody } from '@/shared/lib/row-form'
import type { RowDraft } from '../types'

export function useSaveRow(table: string, meta: TableMeta | undefined, enums: Record<string, string[]>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (draft: RowDraft) => {
      const body = rowBody(meta?.columns ?? [], enums, draft.values, draft.initial) as Row
      if (!draft.key) return tablesService.create(table, body)
      if (Object.keys(body).length) return tablesService.update(table, draft.key, body)
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
