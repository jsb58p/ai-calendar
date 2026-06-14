import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalsApi, feedbackApi } from '../api'
import type { Goal, Feedback } from '../types'

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.list,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Pick<Goal, 'text' | 'timeframe' | 'priority'>) =>
      goalsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: Feedback) => feedbackApi.submit(payload),
  })
}
