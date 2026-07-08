import { useMutation, useQueryClient } from '@tanstack/react-query';

import { camerasHandler, locationsHandler } from '@api/handlers';

import type { LocationForUpdateDto } from '@app-types';

type UpdateLocationInput = {
  id: string;
  payload: LocationForUpdateDto;
};

export function useUpdateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateLocationInput) => locationsHandler.update.request(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [locationsHandler.getList.queryKey] });
      queryClient.invalidateQueries({ queryKey: [camerasHandler.getList.queryKey] });
    },
  });
}
