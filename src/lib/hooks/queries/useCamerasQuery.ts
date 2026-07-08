import { useQuery } from '@tanstack/react-query';

import { camerasHandler } from '@api/handlers';

export function useCamerasQuery() {
  return useQuery({
    queryKey: [camerasHandler.getList.queryKey],
    queryFn: camerasHandler.getList.request,
  });
}
