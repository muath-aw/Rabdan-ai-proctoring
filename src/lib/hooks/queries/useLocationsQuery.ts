import { useQuery } from '@tanstack/react-query';

import { locationsHandler } from '@api/handlers';

export function useLocationsQuery() {
  return useQuery({
    queryKey: [locationsHandler.getList.queryKey],
    queryFn: locationsHandler.getList.request,
  });
}
