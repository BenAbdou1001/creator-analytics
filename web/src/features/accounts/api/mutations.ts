import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AccountInput } from '../types'
import { toAccount, toCreateAccountDto } from './mappers'
import { accountsService } from './service'

// Account writes change every dashboard number, so mutations refresh all queries.
export function useSaveAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: AccountInput }) => {
      const dto = toCreateAccountDto(input)
      return (id ? accountsService.update(id, dto) : accountsService.create(dto)).then(toAccount)
    },
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => accountsService.remove(id).then(toAccount),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
