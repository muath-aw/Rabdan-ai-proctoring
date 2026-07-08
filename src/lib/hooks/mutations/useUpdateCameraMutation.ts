import { useMutation, useQueryClient } from '@tanstack/react-query';

import { camerasHandler } from '@api/handlers';

import type { CameraForUpdateDto } from '@app-types';

type UpdateCameraInput = {
  id: string;
  payload: CameraForUpdateDto;
};

export function useUpdateCameraMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCameraInput) => camerasHandler.update.request(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [camerasHandler.getList.queryKey] });
    },
  });
}
