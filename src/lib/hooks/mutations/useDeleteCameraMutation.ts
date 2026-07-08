import { useMutation, useQueryClient } from '@tanstack/react-query';

import { camerasHandler } from '@api/handlers';

export function useDeleteCameraMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => camerasHandler.delete.request(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [camerasHandler.getList.queryKey] });
    },
  });
}
