import type { LocationForCreateDto, LocationForReadDto, LocationForUpdateDto } from '@app-types';

import { createLocalStorageStore, generateId, simulateLatency } from './localStorageStore';

const STORAGE_KEY = 'rabdan.settings.locations.v1';
const store = createLocalStorageStore<LocationForReadDto>(STORAGE_KEY);

const normalizeName = (name: string) => name.trim().toLowerCase();
const normalizeCode = (code: string) => code.trim().toLowerCase();

class DuplicateLocationNameError extends Error {
  constructor() {
    super('DUPLICATE_LOCATION_NAME');
    this.name = 'DuplicateLocationNameError';
  }
}

class DuplicateLocationCodeError extends Error {
  constructor() {
    super('DUPLICATE_LOCATION_CODE');
    this.name = 'DuplicateLocationCodeError';
  }
}

class LocationNotFoundError extends Error {
  constructor() {
    super('LOCATION_NOT_FOUND');
    this.name = 'LocationNotFoundError';
  }
}

async function getLocationList(): Promise<LocationForReadDto[]> {
  const items = store.read().slice().sort((a, b) => a.name.localeCompare(b.name));
  return simulateLatency(items);
}

async function createLocation(payload: LocationForCreateDto): Promise<LocationForReadDto> {
  const items = store.read();
  const nameKey = normalizeName(payload.name);
  const codeKey = normalizeCode(payload.code);

  if (items.some((item) => normalizeCode(item.code) === codeKey)) {
    throw new DuplicateLocationCodeError();
  }
  if (items.some((item) => normalizeName(item.name) === nameKey)) {
    throw new DuplicateLocationNameError();
  }

  const created: LocationForReadDto = {
    id: generateId('loc'),
    code: payload.code.trim(),
    name: payload.name.trim(),
    description: payload.description?.trim() ? payload.description.trim() : null,
    createdAt: new Date().toISOString(),
  };
  store.write([...items, created]);

  return simulateLatency(created);
}

async function updateLocation(id: string, payload: LocationForUpdateDto): Promise<LocationForReadDto> {
  const items = store.read();
  const current = items.find((item) => item.id === id);
  if (!current) throw new LocationNotFoundError();

  const nameKey = normalizeName(payload.name);
  const codeKey = normalizeCode(payload.code);

  if (items.some((item) => item.id !== id && normalizeCode(item.code) === codeKey)) {
    throw new DuplicateLocationCodeError();
  }
  if (items.some((item) => item.id !== id && normalizeName(item.name) === nameKey)) {
    throw new DuplicateLocationNameError();
  }

  const updated: LocationForReadDto = {
    ...current,
    code: payload.code.trim(),
    name: payload.name.trim(),
    description: payload.description?.trim() ? payload.description.trim() : null,
  };
  store.write(items.map((item) => (item.id === id ? updated : item)));

  return simulateLatency(updated);
}

async function deleteLocation(id: string): Promise<{ id: string }> {
  const items = store.read();
  if (!items.some((item) => item.id === id)) throw new LocationNotFoundError();

  store.write(items.filter((item) => item.id !== id));
  return simulateLatency({ id });
}

export const locationsHandler = {
  getList: {
    queryKey: 'settings/locations/list',
    request: getLocationList,
  },
  create: {
    request: createLocation,
  },
  update: {
    request: updateLocation,
  },
  delete: {
    request: deleteLocation,
  },
} as const;

export { DuplicateLocationCodeError, DuplicateLocationNameError, LocationNotFoundError };
