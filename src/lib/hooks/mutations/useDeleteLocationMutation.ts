import { useMutation, useQueryClient } from '@tanstack/react-query';

import { camerasHandler, locationsHandler } from '@api/handlers';

export class LocationInUseError extends Error {
  camerasCount: number;

  constructor(camerasCount: number) {
    super('LOCATION_IN_USE');
    this.name = 'LocationInUseError';
    this.camerasCount = camerasCount;
  }
}

export function useDeleteLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const cameras = await camerasHandler.getByLocation.request(id);
      if (cameras.length > 0) throw new LocationInUseError(cameras.length);

      return locationsHandler.delete.request(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [locationsHandler.getList.queryKey] });
    },
  });
}
