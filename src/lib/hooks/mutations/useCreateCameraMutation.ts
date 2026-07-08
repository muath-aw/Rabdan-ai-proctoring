import { useMutation, useQueryClient } from '@tanstack/react-query';

import { camerasHandler } from '@api/handlers';

import type { CameraForCreateDto } from '@app-types';

export function useCreateCameraMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CameraForCreateDto) => camerasHandler.create.request(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [camerasHandler.getList.queryKey] });
    },
  });
}
