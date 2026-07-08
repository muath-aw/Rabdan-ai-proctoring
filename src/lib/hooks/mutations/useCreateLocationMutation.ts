import { useMutation, useQueryClient } from '@tanstack/react-query';

import { camerasHandler, locationsHandler } from '@api/handlers';

import type { LocationForCreateDto } from '@app-types';

export function useCreateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LocationForCreateDto) => locationsHandler.create.request(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [locationsHandler.getList.queryKey] });
      queryClient.invalidateQueries({ queryKey: [camerasHandler.getList.queryKey] });
    },
  });
}
